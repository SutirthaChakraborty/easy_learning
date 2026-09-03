/**
 * BILATERAL — tasks that need both hands, or one hand crossing the body.
 *
 *   Two-Hand Catch      two targets must be touched at the same moment
 *   Cross-the-Middle    the left hand must reach a target on the right, and
 *                       vice versa
 *
 * These are the games where knowing which hand did what actually decides
 * correctness, so they are also where the handedness convention has to be
 * right. The engine opens with a three-second hand check ("show me your right
 * hand") that auto-corrects `handSwap` if the device reports the mirror image —
 * which doubles as a body-awareness prompt rather than being dead setup time.
 *
 * `bilateralOffsetMs` — how far apart the two contacts were — is the metric
 * that matters: a child who reaches with one hand and then the other has done
 * something different from a child who arrived with both together, even though
 * both "touched both targets".
 */
import { OUTCOME } from '../core/telemetry'
import { BilateralGate, DwellSelector } from '../core/interactions'
import { clamp, lerp, pick, sample } from '../core/geometry'
import { getSettings, accommodate, updateSettings } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, PALETTE, hexA, colorOf,
} from '../core/draw'
import { HAND_BONES, POSE_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail, contactError,
} from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSets } from '../content'

export function bilateralEngine(game) {
  const cfg = {
    trials: 10,
    /** 'together' — two targets at once | 'cross' — one target, named hand */
    mode: 'together',
    sets: ['shapes'],
    spriteKind: 'shape',
    /** Ask the child to identify a hand before starting (auto-calibrates swap). */
    handCheck: true,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let gate = null
  let selector = null
  let targets = []
  let requiredHand = null
  let checkState = cfg.handCheck ? 'pending' : 'done'
  let checkSide = 'right'
  let checkStartedAt = 0
  let heldIds = []
  let lastOffset = null
  const trail = new Trail(14)
  const trailL = new Trail(14)

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate(
      { radius: level.targetSize ?? 0.12, windowMs: level.windowMs || 0 },
      s
    )
    const box = api.reachBox(level.eccentricity ?? 1)
    const pool = getSets(cfg.sets)
    if (!pool.length) return null

    if (cfg.mode === 'together') {
      // One target well left of centre, one well right — a single hand cannot
      // reach both, which is what forces the bilateral pattern.
      const items = sample(pool, 2, api.rng)
      const y = lerp(box.minY, box.maxY, 0.35 + api.rng() * 0.3)
      const spread = clamp(0.5 * (level.eccentricity ?? 1) + 0.22, 0.28, 0.42)
      const slots = [
        { x: clamp(0.5 - spread, 0.08, 0.42), y },
        { x: clamp(0.5 + spread, 0.58, 0.92), y },
      ]
      targets = makeTargets(items, slots, {
        radius: spec.radius,
        spriteKind: cfg.spriteKind,
        colors: ['teal', 'yellow'],
      })
      targets[0].wantSide = 'left'
      targets[1].wantSide = 'right'
      gate = new BilateralGate(clamp(650 * (s.extraTimeX || 1), 400, 2200))
      requiredHand = null

      return {
        targetId: targets.map((t) => t.id).join('+'),
        radius: spec.radius,
        windowMs: spec.windowMs,
        choiceCount: 2,
        promptText: 'Touch BOTH at the same time!',
        speakText: 'Touch both of them at the same time',
        answerLabel: 'both together',
      }
    }

    // 'cross': one target, deliberately on the far side from the named hand.
    const item = pick(pool, api.rng)
    const side = index % 2 === 0 ? 'left' : 'right'
    requiredHand = side
    // Crossing means the target sits on the opposite side of the midline from
    // the hand that has to fetch it.
    const targetX = side === 'left' ? lerp(0.6, 0.9, api.rng()) : lerp(0.1, 0.4, api.rng())
    const slot = { x: targetX, y: lerp(box.minY + 0.08, box.maxY - 0.08, api.rng()) }
    targets = makeTargets([item], [slot], { radius: spec.radius, spriteKind: cfg.spriteKind })
    targets[0].color = side === 'left' ? 'teal' : 'yellow'
    targets[0].wantSide = side
    selector = new DwellSelector({ dwellMs: spec.dwellMs })
    gate = null

    return {
      targetId: item.id,
      radius: spec.radius,
      windowMs: spec.windowMs,
      choiceCount: 1,
      requireHand: side,
      promptText: `Reach across with your ${side.toUpperCase()} hand`,
      speakText: `Reach across with your ${side} hand`,
      answerLabel: `${side} hand`,
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    api.setPrompt({ main: trial.promptText, sub: '' })
    void api.say(trial.promptText, { main: trial.promptText, speak: trial.speakText })
    machine.clock.after(900, () => machine.setPhase('respond'))
  }

  /**
   * The hand check. The child raises the named hand; whichever tracked hand
   * comes up highest wins, and if it disagrees with the device's label we flip
   * `handSwap` — the MediaPipe handedness convention assumes a mirrored frame
   * and not every browser/camera pairing behaves the same way.
   */
  function runHandCheck(f) {
    const { frame, now } = f
    if (checkState === 'pending') {
      checkState = 'asking'
      checkStartedAt = now
      checkSide = api.rng() < 0.5 ? 'left' : 'right'
      api.setPrompt({
        main: `Raise your ${checkSide.toUpperCase()} hand`,
        sub: 'Hold it up high',
      })
      void api.say(`Raise your ${checkSide} hand and hold it up`, {
        main: `Raise your ${checkSide.toUpperCase()} hand`,
        sub: 'Hold it up high',
      })
      return
    }

    const elapsed = now - checkStartedAt
    const raised = frame.hands.filter((h) => h.tip.y < 0.42)
    if (elapsed > 1400 && raised.length === 1) {
      const reported = raised[0].side
      if (reported !== checkSide) {
        // The device disagrees with the child. Trust the child.
        const s = getSettings()
        updateSettings({ handSwap: !s.handSwap })
        api.tracker()?.setHandSwap(!s.handSwap)
        api.recorder.event('handSwapCalibrated', { reported, expected: checkSide, swapped: true })
        api.banner('Got it!', 800, PALETTE.teal)
      } else {
        api.recorder.event('handSwapCalibrated', { reported, expected: checkSide, swapped: false })
        api.banner('Perfect!', 800, PALETTE.green)
      }
      api.sfx.correct(1)
      api.haptic('correct')
      checkState = 'done'
      api.clock.after(900, () => machine.next())
      return
    }
    // Give up gracefully rather than blocking a child who cannot do this.
    if (elapsed > 9000) {
      checkState = 'done'
      api.recorder.event('handSwapCalibrated', { skipped: true })
      api.setPrompt({ main: "That's okay — let's play.", sub: '' })
      api.clock.after(700, () => machine.next())
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
        feedbackMs: 1100,
      })
      api.setHud({ total: cfg.trials })
      if (checkState === 'done') machine.next()
    },

    update(f) {
      if (!machine || machine.ended) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const hands = handsFor(frame, s)
      const pointers = pointersFor(frame, s)
      trail.push(hands.find((h) => h.side === 'right')?.tip)
      trailL.push(hands.find((h) => h.side === 'left')?.tip)

      if (checkState !== 'done') {
        runHandCheck(f)
        return
      }
      if (!machine.trial) return
      machine.reach.step(hands[0] || null, now)
      if (machine.phase !== 'respond') return

      if (machine.window?.expired()) {
        machine.resolve({
          accuracy: OUTCOME.OMISSION,
          timedOut: true,
          target: targets[0],
        })
        api.setPrompt({ main: 'Have another go next time.', sub: '' })
        return
      }

      if (cfg.mode === 'together') {
        const res = gate.step(targets, hands, { stageW, stageH, now })
        heldIds = res.held
        if (res.complete) {
          lastOffset = res.offsetMs
          // Two hands together is the skill. One hand hopping between the two
          // targets completes the shape of the task but not the substance, so
          // it is recorded as NEAR with the reason attached.
          const proper = res.usedBothHands
          machine.resolve({
            accuracy: proper ? OUTCOME.CORRECT : OUTCOME.NEAR,
            feedbackAs: proper ? OUTCOME.CORRECT : OUTCOME.NEAR,
            chosenId: machine.trial.targetId,
            target: targets[0],
            at: { x: (targets[0].x + targets[1].x) / 2, y: targets[0].y },
            extra: {
              bilateralOffsetMs: res.offsetMs,
              usedBothHands: proper,
            },
            note: proper ? null : 'one-hand-sequential',
          })
          api.setPrompt({
            main: proper ? 'Both together!' : 'Try both hands at once',
            sub: proper ? `${res.offsetMs} ms apart` : 'One hand on each',
          })
          if (proper && !s.reducedMotion) {
            api.particles.burst(targets[0].x, targets[0].y, colorOf('teal'))
            api.particles.burst(targets[1].x, targets[1].y, colorOf('yellow'))
          }
        }
        return
      }

      // 'cross'
      const res = selector.step(targets, pointers, { dt, now, stageW, stageH })
      if (!res.selected) return
      const t = res.selected
      const usedSide = res.pointer?.side
      const midline = frame.pose?.midline ?? 0.5
      const didCross = usedSide === 'left' ? t.x > midline : t.x < midline
      const rightHand = usedSide === requiredHand
      machine.attempts = (machine.attempts || 0) + 1

      if (rightHand) {
        machine.resolve({
          accuracy: OUTCOME.CORRECT,
          chosenId: t.id,
          target: t,
          contactError: contactError(res.pointer, t, stageW, stageH),
          crossedMidline: didCross,
          at: { x: t.x, y: t.y },
          extra: { usedBothHands: false },
        })
        api.setPrompt({ main: didCross ? 'Great crossing!' : 'Got it!', sub: '' })
      } else if (machine.attempts >= 2) {
        machine.resolve({
          accuracy: OUTCOME.INCORRECT,
          chosenId: t.id,
          target: t,
          crossedMidline: didCross,
          note: 'wrong-hand',
        })
        api.setPrompt({ main: `That was your ${usedSide} hand.`, sub: `Try the ${requiredHand} one next time` })
      } else {
        api.sfx.neutral()
        api.haptic('neutral')
        api.setPrompt({
          main: `Use your ${requiredHand.toUpperCase()} hand`,
          sub: 'Reach right across your body',
        })
        void api.say(`Use your ${requiredHand} hand`, { main: `Use your ${requiredHand.toUpperCase()} hand` })
        machine.clock.after(450, () => selector?.unlock(t.id))
      }
    },

    render(f) {
      const { view, frame, now } = f
      const s = getSettings()
      const p = pulse(now)

      if (checkState !== 'done') {
        // Two big hand outlines so the instruction is visual as well as spoken.
        drawHandHint(view, checkSide, p, s)
      } else if (machine?.trial) {
        // The body midline: seeing the line they have to cross is half the
        // point of a crossing task.
        if (cfg.mode === 'cross' && frame.pose) {
          const x = view.px(frame.pose.midline)
          const ctx = view.ctx
          ctx.save()
          ctx.setLineDash([10, 10])
          ctx.lineWidth = 3
          ctx.strokeStyle = hexA(PALETTE.purple, 0.55)
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, view.h)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.restore()
        }

        const responding = machine.phase === 'respond'
        for (const t of targets) {
          const held = heldIds.includes(t.id)
          drawTarget(view, t, {
            progress: cfg.mode === 'together' ? (held ? 1 : 0) : responding ? selector.progressOf(t.id) : 0,
            hover: held,
            highlight: machine.prompt?.highlightTarget === true,
            pulse: p,
            correct: machine.phase === 'feedback' && machine.lastOutcome === OUTCOME.CORRECT,
            reducedMotion: s.reducedMotion,
            highContrast: s.highContrast,
          })
          if (t.wantSide) drawSideBadge(view, t)
        }

        // A tether between the two targets makes "at the same time" legible.
        if (cfg.mode === 'together' && targets.length === 2) {
          const ctx = view.ctx
          ctx.save()
          ctx.setLineDash([12, 10])
          ctx.lineWidth = Math.max(2, view.short * 0.006)
          ctx.strokeStyle = heldIds.length === 2 ? hexA(PALETTE.green, 0.85) : 'rgba(255,255,255,0.22)'
          ctx.beginPath()
          ctx.moveTo(view.px(targets[0].x), view.py(targets[0].y))
          ctx.lineTo(view.px(targets[1].x), view.py(targets[1].y))
          ctx.stroke()
          ctx.setLineDash([])
          ctx.restore()
        }
      }

      if (frame.pose && s.showSkeleton) {
        drawSkeleton(view, frame.pose.lm, POSE_BONES, { color: 'rgba(255,255,255,0.22)' })
      }
      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.55)' : 'rgba(255,217,61,0.55)',
          })
        }
      }
      for (const h of frame.hands) {
        drawHandCursor(view, h, {
          trail: h.side === 'left' ? trailL.points : trail.points,
          reducedMotion: s.reducedMotion,
        })
      }

      if (lastOffset != null && machine?.phase === 'feedback') {
        const ctx = view.ctx
        ctx.save()
        ctx.font = `700 ${view.short * 0.035}px Fredoka, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(`${lastOffset} ms apart`, view.w / 2, view.h * 0.93)
        ctx.restore()
      }
    },

    unmount() {
      gate?.reset()
      selector?.reset()
      targets = []
      machine = null
    },
  }

  return module
}

/** Labels which hand a target belongs to, in colour as well as text. */
function drawSideBadge(view, t) {
  const ctx = view.ctx
  const r = view.pr(t.radius)
  const y = view.py(t.y) - r * 1.5
  ctx.save()
  ctx.font = `800 ${Math.max(11, r * 0.34)}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(3,7,18,0.85)'
  const label = t.wantSide === 'left' ? 'LEFT HAND' : 'RIGHT HAND'
  ctx.strokeText(label, view.px(t.x), y)
  ctx.fillStyle = t.wantSide === 'left' ? PALETTE.teal : PALETTE.yellow
  ctx.fillText(label, view.px(t.x), y)
  ctx.restore()
}

function drawHandHint(view, side, p, s) {
  const ctx = view.ctx
  const size = view.short * 0.22
  const x = side === 'left' ? view.w * 0.3 : view.w * 0.7
  const y = view.h * 0.42
  ctx.save()
  ctx.globalAlpha = s.reducedMotion ? 0.9 : 0.75 + p * 0.25
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🖐', x, y)
  ctx.globalAlpha = 1
  ctx.font = `800 ${size * 0.24}px Fredoka, system-ui, sans-serif`
  ctx.lineWidth = size * 0.04
  ctx.strokeStyle = 'rgba(3,7,18,0.85)'
  const label = side === 'left' ? 'LEFT' : 'RIGHT'
  ctx.strokeText(label, x, y + size * 0.62)
  ctx.fillStyle = side === 'left' ? PALETTE.teal : PALETTE.yellow
  ctx.fillText(label, x, y + size * 0.62)
  ctx.restore()
}
