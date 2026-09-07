/**
 * POSE — whole-body imitation, gestures, and instruction following.
 *
 *   Mirror Me              copy an arm posture shown by an avatar
 *   Copy My Gesture        wave / thumbs up / point / open palm
 *   Personal Space Bubble  keep your body inside (or outside) a zone
 *   Follow Two / Three     hold a spoken instruction chain and carry it out
 *   Fast vs Slow           copy a movement *speed*, not a position
 *
 * Matching is on joint *angles* normalised by shoulder width, so it works
 * whatever the child's height, distance from the camera or position in frame —
 * a positional match would fail the moment they took a step sideways.
 *
 * One thing this engine deliberately does not do: read emotion from a face.
 * Facial movement is not a reliable measure of an internal state, so emotion
 * work lives in the scenario-based TAP games where the *situation* supplies the
 * answer.
 */
import { OUTCOME } from '../core/telemetry'
import { matchPosture, HoldTimer, MotionMeter } from '../core/interactions'
import { clamp, sample, shuffle, aspectDist, layoutSlots, fitRadius } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawSkeleton, drawZone, drawTarget, PALETTE, hexA, drawBanner,
} from '../core/draw'
import { POSE_BONES, HAND_BONES, POSE } from '../core/vision'
import { TrialMachine, handsFor, pointersFor, pulse } from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSet, getSets } from '../content'

export function poseEngine(game) {
  const cfg = {
    trials: 8,
    /** 'imitate' | 'gesture' | 'bubble' | 'instructions' | 'speed' */
    mode: 'imitate',
    /** How long the posture must be held to count. */
    holdMs: 900,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let hold = null
  let motion = null
  let targetSpec = null // the posture to match
  let targetItem = null
  let zone = null
  let steps = [] // instruction chain
  let stepIndex = 0
  let bestScore = 0
  let lastScore = 0
  let wantSpeed = null
  let speedSamples = []
  let instructionTargets = []
  let stepDoneAt = []

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: level.targetSize ?? 0.11, windowMs: level.windowMs || 0, holdMs: cfg.holdMs }, s)
    const holdMs = clamp((level.holdMs ?? cfg.holdMs) * (s.extraTimeX || 1), 400, 5000)
    bestScore = 0
    lastScore = 0
    stepIndex = 0
    stepDoneAt = []
    speedSamples = []
    zone = null
    targetSpec = null
    targetItem = null
    instructionTargets = []

    if (cfg.mode === 'imitate' || cfg.mode === 'gesture') {
      const pool = getSet('gestures').filter((g) => g.posture)
      if (!pool.length) return null
      targetItem = pool[index % pool.length]
      targetSpec = targetItem.posture
      hold = new HoldTimer(holdMs)
      return {
        targetId: targetItem.id,
        radius: spec.radius,
        windowMs: clamp((spec.windowMs || 9000) * 1.6, 6000, 30000),
        holdMs,
        choiceCount: 1,
        promptText: cfg.mode === 'gesture' ? `Show me: ${targetItem.label}` : `Copy this: ${targetItem.label}`,
        speakText: cfg.mode === 'gesture' ? `Show me ${targetItem.label}` : `Copy this position: ${targetItem.label}`,
        answerLabel: targetItem.label,
      }
    }

    if (cfg.mode === 'bubble') {
      // Alternate inside/outside so the child has to read the instruction each
      // time rather than settling into one behaviour.
      const wantInside = index % 2 === 0
      const radius = clamp(0.3 - (level.eccentricity ?? 1) * 0.06, 0.16, 0.32)
      zone = {
        shape: 'circle',
        x: 0.5,
        y: 0.5,
        radius,
        color: wantInside ? 'teal' : 'orange',
        label: wantInside ? 'Stay inside' : 'Stay outside',
        wantInside,
      }
      hold = new HoldTimer(holdMs * 1.6)
      return {
        targetId: wantInside ? 'inside' : 'outside',
        radius,
        windowMs: clamp((spec.windowMs || 12000) * 1.5, 8000, 30000),
        holdMs: holdMs * 1.6,
        choiceCount: 1,
        promptText: wantInside ? 'Keep your body INSIDE the bubble' : 'Keep your body OUTSIDE the bubble',
        speakText: wantInside ? 'Keep your body inside the bubble' : 'Move your body outside the bubble',
        answerLabel: wantInside ? 'inside' : 'outside',
      }
    }

    if (cfg.mode === 'speed') {
      wantSpeed = index % 2 === 0 ? 'slow' : 'fast'
      motion = new MotionMeter(600)
      hold = new HoldTimer(holdMs * 2)
      return {
        targetId: wantSpeed,
        radius: spec.radius,
        windowMs: 14000,
        holdMs: holdMs * 2,
        choiceCount: 1,
        promptText: wantSpeed === 'slow' ? 'Move your arms VERY SLOWLY' : 'Move your arms FAST!',
        speakText: wantSpeed === 'slow' ? 'Move your arms very slowly' : 'Move your arms fast',
        answerLabel: wantSpeed,
      }
    }

    // 'instructions': a chain of 2-3 things to do in order, held in memory.
    const chainLength = clamp(level.steps ?? 2, 1, 3)
    const actions = getSet('instructions').filter((i) => i.attrs?.check)
    const touchPool = getSets(cfg.touchSets || ['shapes', 'colors'])
    const chain = []

    // Mix action steps with touch-a-target steps: a pure action chain is easy
    // to mime along with, while a touch step forces a real reach.
    const wantTouch = Math.min(chainLength, 1 + (chainLength > 2 ? 1 : 0))
    const touchItems = sample(touchPool, wantTouch, api.rng)
    const actionItems = sample(actions, chainLength - wantTouch, api.rng)

    for (const it of touchItems) chain.push({ kind: 'touch', item: it, label: `touch the ${it.label.toLowerCase()}` })
    for (const it of actionItems) chain.push({ kind: 'action', item: it, label: it.label.toLowerCase(), check: it.attrs.check })
    steps = shuffle(chain, api.rng)

    // Every touch target plus a couple of distractors, all on screen at once.
    const distractors = sample(
      touchPool.filter((t) => !touchItems.some((x) => x.id === t.id)),
      clamp((level.choices ?? 3) - wantTouch, 1, 4),
      api.rng
    )
    const all = shuffle([...touchItems, ...distractors], api.rng)
    const box = api.reachBox(level.eccentricity ?? 1)
    const radius = fitRadius(all.length, spec.radius)
    const slots = layoutSlots(all.length, box, radius, api.rng)
    instructionTargets = all.map((item, i) => ({
      id: item.id,
      item,
      x: slots[i].x,
      y: slots[i].y,
      radius,
      color: item.attrs?.color || ['blue', 'green', 'orange', 'purple', 'pink'][i % 5],
      sprite: item.shape ? { kind: 'shape', value: item.shape } : item.emoji ? { kind: 'emoji', value: item.emoji } : { kind: 'text', value: item.text ?? item.label },
    }))

    const sentence = steps.map((st, i) => (i === 0 ? st.label : i === steps.length - 1 ? `then ${st.label}` : `${st.label}`)).join(', ')
    hold = new HoldTimer(500)

    return {
      targetId: steps.map((s2) => s2.item.id).join('+'),
      radius: spec.radius,
      windowMs: clamp((spec.windowMs || 16000) * 1.4, 10000, 40000),
      steps: steps.length,
      memorySpan: steps.length,
      choiceCount: instructionTargets.length,
      promptText: capitalise(sentence),
      speakText: sentence,
      answerLabel: sentence,
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    api.setPrompt({ main: trial.promptText, sub: '' })
    void api.say(trial.promptText, { main: trial.promptText, speak: trial.speakText })
    // Instruction chains need the whole sentence heard before the child starts,
    // otherwise the task measures listening speed rather than memory.
    const wait = cfg.mode === 'instructions' ? 900 + trial.steps * 900 : 1100
    machine.clock.after(wait, () => machine.setPhase('respond'))
  }

  /** Verifies one action step against the body. */
  function checkAction(check, frame) {
    const pose = frame.pose
    const hands = frame.hands
    if (!pose) return false
    const lm = pose.lm
    const sw = pose.shoulderWidth || 0.2
    const above = (idx, ref) => lm[idx] && lm[ref] && lm[idx].y < lm[ref].y - sw * 0.15

    switch (check) {
      case 'raiseLeft':
        return above(POSE.LEFT_WRIST, POSE.LEFT_SHOULDER)
      case 'raiseRight':
        return above(POSE.RIGHT_WRIST, POSE.RIGHT_SHOULDER)
      case 'raiseBoth':
        return above(POSE.LEFT_WRIST, POSE.LEFT_SHOULDER) && above(POSE.RIGHT_WRIST, POSE.RIGHT_SHOULDER)
      case 'clap': {
        if (hands.length === 2) {
          return aspectDist(hands[0].palm, hands[1].palm, 1, 1) < hands[0].span * 1.4
        }
        const lw = lm[POSE.LEFT_WRIST]
        const rw = lm[POSE.RIGHT_WRIST]
        return lw && rw && Math.hypot(lw.x - rw.x, lw.y - rw.y) < sw * 0.4
      }
      case 'touchHead': {
        const nose = lm[POSE.NOSE]
        return [POSE.LEFT_WRIST, POSE.RIGHT_WRIST].some((w) => {
          const p = lm[w]
          return p && nose && Math.hypot(p.x - nose.x, p.y - nose.y) < sw * 0.7
        })
      }
      case 'touchTummy': {
        const hip = lm[POSE.LEFT_HIP] && lm[POSE.RIGHT_HIP] ? pose.hipMid : null
        return [POSE.LEFT_WRIST, POSE.RIGHT_WRIST].some((w) => {
          const p = lm[w]
          return p && hip && Math.hypot(p.x - hip.x, p.y - hip.y) < sw * 0.75
        })
      }
      case 'armsOut': {
        const lw = lm[POSE.LEFT_WRIST]
        const rw = lm[POSE.RIGHT_WRIST]
        return lw && rw && Math.abs(lw.x - rw.x) > sw * 2.3 && Math.abs(lw.y - pose.shoulderMid.y) < sw * 0.6
      }
      case 'wave':
        return hands.some((h) => h.gesture === 'open' && h.tip.y < pose.shoulderMid.y)
      case 'spin':
        // A real spin is hard to verify from a single camera; shoulders
        // narrowing to under half their width is a solid proxy for turning.
        return sw < 0.13
      case 'stand':
        return pose.visible > 0.7 && lm[POSE.LEFT_ANKLE]?.visibility > 0.4
      default:
        return false
    }
  }

  const module = {
    requires: 'both',

    difficultySnapshot() {
      const d = resolveDifficulty(game)
      return { ...d.level, promptStage: d.promptStage }
    },

    mount(a) {
      api = a
      machine = new TrialMachine({
        api,
        totalTrials: cfg.trials,
        build: buildTrial,
        onPhase,
        feedbackMs: 1300,
      })
      api.setHud({ total: cfg.trials })
      machine.next()
    },

    update(f) {
      if (!machine || machine.ended || !machine.trial) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      machine.reach.step(handsFor(frame, s)[0] || null, now)
      if (machine.phase !== 'respond') return

      if (!frame.pose) {
        api.setPrompt({ main: 'Step back so I can see you', sub: 'I need to see your shoulders' })
        return
      }

      if (machine.window?.expired()) {
        machine.resolve({
          accuracy: bestScore > 0.5 ? OUTCOME.NEAR : OUTCOME.OMISSION,
          timedOut: true,
          extra: { postureScore: round(bestScore, 3) },
          note: bestScore > 0.5 ? 'close-but-not-held' : null,
        })
        api.setPrompt({ main: bestScore > 0.5 ? 'So close!' : 'Have a look at the picture.', sub: '' })
        return
      }

      // ── imitate / gesture ──
      if (targetSpec) {
        const m = matchPosture(frame.pose, targetSpec, { threshold: 0.72 })
        lastScore = m.score
        bestScore = Math.max(bestScore, m.score)
        const { justCompleted } = hold.step(m.matched, dt)
        if (justCompleted) {
          machine.resolve({
            accuracy: OUTCOME.CORRECT,
            chosenId: targetItem.id,
            target: { x: 0.5, y: 0.4, color: 'green' },
            at: { x: 0.5, y: 0.4 },
            extra: { postureScore: round(bestScore, 3), holdBreaks: hold.breaks },
          })
          api.setPrompt({ main: 'That is it!', sub: targetItem.label })
        }
        return
      }

      // ── personal space bubble ──
      if (zone) {
        const centre = frame.pose.hipMid
        const d = Math.hypot(centre.x - zone.x, (centre.y - zone.y) * (stageH / Math.min(stageW, stageH)))
        const inside = d <= zone.radius
        const ok = zone.wantInside ? inside : !inside
        lastScore = ok ? 1 : 0
        bestScore = Math.max(bestScore, ok ? 1 : 0)
        const { justCompleted, justBroke } = hold.step(ok, dt)
        if (justBroke) {
          api.sfx.tick()
          api.haptic('tick')
        }
        if (justCompleted) {
          machine.resolve({
            accuracy: OUTCOME.CORRECT,
            chosenId: machine.trial.targetId,
            target: { x: zone.x, y: zone.y, color: zone.color },
            at: { x: zone.x, y: zone.y },
            extra: { holdBreaks: hold.breaks, postureScore: 1 },
          })
          api.setPrompt({ main: 'Held it!', sub: zone.label })
        }
        return
      }

      // ── fast vs slow ──
      if (wantSpeed) {
        const mag = motion.step(frame.pose, now)
        speedSamples.push(mag)
        if (speedSamples.length > 240) speedSamples.shift()
        const ok = wantSpeed === 'slow' ? mag < 0.55 : mag > 1.5
        lastScore = clamp(wantSpeed === 'slow' ? 1 - mag / 1.4 : mag / 2.4, 0, 1)
        bestScore = Math.max(bestScore, lastScore)
        const { justCompleted } = hold.step(ok, dt)
        if (justCompleted) {
          const avg = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
          machine.resolve({
            accuracy: OUTCOME.CORRECT,
            chosenId: wantSpeed,
            target: { x: 0.5, y: 0.4, color: 'green' },
            at: { x: 0.5, y: 0.4 },
            extra: { postureScore: round(bestScore, 3), movementMagnitude: round(avg, 3) },
          })
          api.setPrompt({ main: wantSpeed === 'slow' ? 'Beautifully slow!' : 'Wow, fast!', sub: '' })
        }
        return
      }

      // ── instruction chain ──
      const step = steps[stepIndex]
      if (!step) return
      let done = false
      if (step.kind === 'action') {
        done = checkAction(step.check, frame)
      } else {
        const pointers = pointersFor(frame, s)
        const t = instructionTargets.find((x) => x.id === step.item.id)
        done = Boolean(
          t && pointers.some((p) => aspectDist(p, t, stageW, stageH) <= t.radius * 1.2)
        )
        // A touch on the WRONG target is a real error in a chain task, because
        // it means the instruction was not held correctly.
        if (!done) {
          const wrong = instructionTargets.find(
            (x) => x.id !== step.item.id && pointers.some((p) => aspectDist(p, x, stageW, stageH) <= x.radius * 1.1)
          )
          if (wrong && !step.warned) {
            step.warned = true
            api.sfx.neutral()
            api.haptic('neutral')
            api.setPrompt({ main: `Next: ${capitalise(step.label)}`, sub: `Step ${stepIndex + 1} of ${steps.length}` })
          }
        }
      }

      const { justCompleted } = hold.step(done, dt)
      if (justCompleted) {
        stepDoneAt.push(Math.round(now))
        stepIndex++
        hold.reset(500)
        api.sfx.collect(stepIndex)
        api.haptic('tap')
        if (stepIndex >= steps.length) {
          const cleanRun = steps.every((st) => !st.warned)
          machine.resolve({
            accuracy: cleanRun ? OUTCOME.CORRECT : OUTCOME.INCORRECT,
            feedbackAs: cleanRun ? OUTCOME.CORRECT : OUTCOME.NEAR,
            chosenId: machine.trial.targetId,
            target: { x: 0.5, y: 0.4, color: 'green' },
            at: { x: 0.5, y: 0.4 },
            note: cleanRun ? null : 'needed-reminder',
            extra: { stepLatenciesMs: stepDoneAt.join(',') },
          })
          api.setPrompt({ main: cleanRun ? 'All of them, in order!' : 'You did them all!', sub: '' })
        } else {
          api.setPrompt({
            main: `Now: ${capitalise(steps[stepIndex].label)}`,
            sub: `Step ${stepIndex + 1} of ${steps.length}`,
          })
        }
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const p = pulse(now)

      if (zone) {
        drawZone(view, zone, { active: lastScore > 0.5, highContrast: s.highContrast })
      }

      for (const t of instructionTargets) {
        const isNext = steps[stepIndex]?.kind === 'touch' && steps[stepIndex].item.id === t.id
        drawTarget(view, t, {
          pulse: p,
          highlight: isNext && machine.prompt?.highlightTarget === true,
          dim: steps.slice(0, stepIndex).some((st) => st.item.id === t.id),
          reducedMotion: s.reducedMotion,
          highContrast: s.highContrast,
        })
      }

      // The model posture, drawn as a stick avatar beside the child.
      if (targetSpec && machine.phase !== 'feedback') {
        drawPostureAvatar(view, targetSpec, targetItem, lastScore, p, s)
      }

      if (wantSpeed) drawSpeedMeter(view, motion?.value() ?? 0, wantSpeed)

      // Match meter — the child can see themselves getting closer, which is the
      // difference between "copy this" being solvable and being a guess.
      if (targetSpec || zone || wantSpeed) drawHoldMeter(view, hold?.elapsed ?? 0, hold?.holdMs ?? 1, lastScore)

      if (frame.pose) {
        drawSkeleton(view, frame.pose.lm, POSE_BONES, {
          color: lastScore > 0.72 ? hexA(PALETTE.green, 0.85) : 'rgba(255,255,255,0.5)',
          joints: true,
          lineWidth: Math.max(3, view.short * 0.008),
        })
      } else if (machine.phase === 'respond') {
        drawBanner(view, 'Step back a little', { size: 0.06, y: 0.5, color: PALETTE.yellow })
      }
      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.5)' : 'rgba(255,217,61,0.5)',
          })
        }
      }

      if (steps.length > 1) drawStepChips(view, steps, stepIndex)
    },

    unmount() {
      machine = null
      targetSpec = null
      zone = null
      steps = []
      instructionTargets = []
    },
  }

  return module
}

const round = (v, dp = 0) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp)
const capitalise = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/**
 * A stick-figure avatar holding the target posture. Drawn from the same joint
 * spec the matcher uses, so what the child sees is exactly what is being
 * checked.
 */
function drawPostureAvatar(view, spec, item, score, p, s) {
  const ctx = view.ctx
  const cx = view.w * 0.15
  const cy = view.h * 0.32
  const sw = view.short * 0.09 // shoulder half-width in px
  const good = score > 0.72

  const shoulderL = { x: cx - sw, y: cy }
  const shoulderR = { x: cx + sw, y: cy }
  const hipL = { x: cx - sw * 0.7, y: cy + sw * 2.1 }
  const hipR = { x: cx + sw * 0.7, y: cy + sw * 2.1 }

  // Wrist positions from the rise/spread spec — the same normalised units the
  // matcher uses, so the picture cannot drift from the check.
  const wrist = (side) => {
    const rise = spec[`${side}WristRise`]
    const spread = spec[`${side}WristSpread`]
    const elbow = spec[`${side}Elbow`] ?? 160
    if (rise == null && spread == null) {
      // No wrist constraint: draw a neutral arm bent by the elbow angle.
      const dir = side === 'left' ? -1 : 1
      const bend = (1 - clamp(elbow / 180, 0, 1)) * sw * 1.2
      return { x: cx + dir * sw * 1.7, y: cy + sw * 1.5 - bend }
    }
    return {
      x: cx + (spread ?? (side === 'left' ? -1 : 1)) * sw * 2,
      y: cy - (rise ?? 0) * sw * 2,
    }
  }
  const wl = wrist('left')
  const wr = wrist('right')
  const el = { x: (shoulderL.x + wl.x) / 2 - sw * 0.25, y: (shoulderL.y + wl.y) / 2 }
  const er = { x: (shoulderR.x + wr.x) / 2 + sw * 0.25, y: (shoulderR.y + wr.y) / 2 }

  ctx.save()
  ctx.globalAlpha = s.reducedMotion ? 0.92 : 0.8 + p * 0.2

  // Panel behind the avatar so it reads against any room.
  ctx.fillStyle = 'rgba(6,12,28,0.6)'
  ctx.strokeStyle = good ? hexA(PALETTE.green, 0.8) : 'rgba(126,232,255,0.4)'
  ctx.lineWidth = 2
  const pad = sw * 1.1
  ctx.beginPath()
  ctx.rect(cx - sw * 2.9, cy - sw * 3.2, sw * 5.8, sw * 6.4)
  ctx.fill()
  ctx.stroke()
  void pad

  ctx.strokeStyle = good ? PALETTE.green : '#7ee8ff'
  ctx.lineWidth = Math.max(4, sw * 0.2)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const line = (a, b) => {
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  line(shoulderL, shoulderR)
  line(shoulderL, hipL)
  line(shoulderR, hipR)
  line(hipL, hipR)
  line(shoulderL, el)
  line(el, wl)
  line(shoulderR, er)
  line(er, wr)
  line(hipL, { x: hipL.x, y: hipL.y + sw * 1.6 })
  line(hipR, { x: hipR.x, y: hipR.y + sw * 1.6 })

  ctx.beginPath()
  ctx.arc(cx, cy - sw * 1.1, sw * 0.66, 0, Math.PI * 2)
  ctx.stroke()

  for (const w of [wl, wr]) {
    ctx.beginPath()
    ctx.arc(w.x, w.y, sw * 0.24, 0, Math.PI * 2)
    ctx.fillStyle = good ? PALETTE.green : '#7ee8ff'
    ctx.fill()
  }

  if (item?.label) {
    ctx.font = `800 ${sw * 0.5}px Fredoka, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.fillText(item.label, cx, cy + sw * 4.2)
  }
  ctx.restore()
}

function drawHoldMeter(view, elapsed, total, score) {
  const ctx = view.ctx
  const w = view.w * 0.3
  const h = Math.max(9, view.short * 0.022)
  const x = view.w / 2 - w / 2
  const y = view.h * 0.93
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = score > 0.72 ? PALETTE.green : score > 0.45 ? PALETTE.yellow : PALETTE.orange
  ctx.fillRect(x, y, w * clamp(elapsed / Math.max(total, 1), 0, 1), h)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)
  ctx.font = `700 ${h * 0.9}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(`${Math.round(clamp(score, 0, 1) * 100)}% match`, view.w / 2, y - h * 0.5)
  ctx.restore()
}

function drawSpeedMeter(view, mag, want) {
  const ctx = view.ctx
  const w = view.w * 0.34
  const h = Math.max(12, view.short * 0.03)
  const x = view.w / 2 - w / 2
  const y = view.h * 0.86
  // The band the child is aiming for, drawn on the meter so "slow" is a place
  // to get to rather than an abstract word.
  const bandFrom = want === 'slow' ? 0 : 0.62
  const bandTo = want === 'slow' ? 0.22 : 1
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = hexA(PALETTE.green, 0.35)
  ctx.fillRect(x + w * bandFrom, y, w * (bandTo - bandFrom), h)
  const pos = clamp(mag / 2.4, 0, 1)
  ctx.fillStyle = pos >= bandFrom && pos <= bandTo ? PALETTE.green : PALETTE.yellow
  ctx.fillRect(x + w * pos - 3, y - 4, 6, h + 8)
  ctx.font = `700 ${h * 0.62}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('slow', x, y - h * 0.35)
  ctx.textAlign = 'right'
  ctx.fillText('fast', x + w, y - h * 0.35)
  ctx.restore()
}

function drawStepChips(view, steps, done) {
  const ctx = view.ctx
  const fs = Math.max(10, view.short * 0.024)
  ctx.save()
  ctx.font = `700 ${fs}px Fredoka, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const y = view.h * 0.975
  const widths = steps.map((s) => ctx.measureText(s.label).width + fs * 1.5)
  const total = widths.reduce((a, b) => a + b, 0) + (steps.length - 1) * fs * 0.4
  let x = view.w / 2 - total / 2
  steps.forEach((s, i) => {
    const w = widths[i]
    const complete = i < done
    const active = i === done
    ctx.fillStyle = complete ? hexA(PALETTE.green, 0.3) : active ? hexA(PALETTE.yellow, 0.28) : 'rgba(255,255,255,0.1)'
    ctx.fillRect(x, y - fs, w, fs * 2)
    ctx.fillStyle = complete ? '#8bf0b4' : active ? '#ffe38a' : 'rgba(255,255,255,0.6)'
    ctx.fillText(`${complete ? '✓ ' : ''}${s.label}`, x + w / 2, y)
    x += w + fs * 0.4
  })
  ctx.restore()
}
