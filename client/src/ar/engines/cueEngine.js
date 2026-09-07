/**
 * CUE — act on a signal, and stop on a signal.
 *
 *   Red Light / Green Light   move on green, freeze on red
 *   Traffic Light Body Game   green walk, amber get ready, red freeze
 *   Wait for It               a target appears but only becomes live on a signal
 *   Calm Movement             keep moving, but keep it gentle
 *
 * This is the purest inhibition engine in the platform, and the one where the
 * *cost* of an error is most real-world: freezing at a kerb.
 *
 * Freeze is judged from whole-body movement magnitude, normalised by shoulder
 * width, so it works whatever the child's size or distance. The threshold is
 * deliberately forgiving — an involuntary tremor or a wobble is not a failure
 * to inhibit, and treating it as one would punish the wrong thing.
 */
import { OUTCOME } from '../core/telemetry'
import { MotionMeter, HoldTimer, DwellSelector } from '../core/interactions'
import { layoutSlots, clamp, pick } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawSkeleton, drawTarget, drawHandCursor, edgeFlash, PALETTE, hexA, roundRect,
} from '../core/draw'
import { POSE_BONES, HAND_BONES } from '../core/vision'
import { TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail } from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSets } from '../content'

/** Movement magnitude below this counts as frozen. */
const FREEZE_LIMIT = 0.5
/** Above this, during a "move" phase, the child is genuinely moving. */
const MOVING_MIN = 0.6

export function cueEngine(game) {
  const cfg = {
    trials: 10,
    /** 'lights' | 'wait' | 'calm' */
    mode: 'lights',
    /** Include an amber "get ready" state (Traffic Light Body Game). */
    amber: false,
    sets: ['shapes'],
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let motion = null
  let hold = null
  let selector = null
  let light = 'green' // green | amber | red
  let lightChangedAt = 0
  let flashUntil = 0
  let flashColor = null
  let moveSamples = []
  let freezeSamples = []
  let breaches = 0
  let target = null
  let armed = false
  let armAt = 0
  let progress = 0
  const trail = new Trail(14)

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: level.targetSize ?? 0.12, windowMs: level.windowMs || 0, holdMs: level.holdMs ?? 1400 }, s)
    moveSamples = []
    freezeSamples = []
    breaches = 0
    progress = 0
    armed = false
    target = null

    if (cfg.mode === 'wait') {
      // The target is visible but inert. Touching before the signal is the
      // impulse error this game exists to make visible.
      const pool = getSets(cfg.sets)
      const box = api.reachBox(level.eccentricity ?? 1)
      const slot = layoutSlots(1, box, spec.radius, api.rng)[0]
      target = makeTargets([pick(pool, api.rng)], [slot], { radius: spec.radius, spriteKind: 'shape' })[0]
      target.color = 'slate'
      selector = new DwellSelector({ dwellMs: Math.min(spec.dwellMs, 200) })
      // Wait between 1.2 and 4 s — unpredictable, so the child cannot count.
      armAt = 1200 + api.rng() * 2800
      return {
        targetId: target.id,
        radius: spec.radius,
        windowMs: clamp((spec.windowMs || 4000) + armAt, 4000, 20000),
        choiceCount: 1,
        promptText: 'Wait for the green light…',
        speakText: 'Wait. Do not touch it until it turns green.',
        answerLabel: 'waited for the signal',
        armAt,
      }
    }

    if (cfg.mode === 'calm') {
      motion = new MotionMeter(700)
      hold = new HoldTimer(clamp((level.holdMs ?? 3000) * (s.extraTimeX || 1), 1500, 9000))
      return {
        targetId: 'calm',
        radius: spec.radius,
        windowMs: 20000,
        holdMs: hold.holdMs,
        choiceCount: 1,
        promptText: 'Keep moving — nice and gentle',
        speakText: 'Keep your arms moving, nice and gentle',
        answerLabel: 'gentle movement',
      }
    }

    // 'lights'
    motion = new MotionMeter(420)
    light = 'green'
    lightChangedAt = 0
    const holdMs = clamp((level.holdMs ?? 1600) * (s.extraTimeX || 1), 800, 5000)
    hold = new HoldTimer(holdMs)
    return {
      targetId: 'freeze',
      radius: spec.radius,
      windowMs: 0,
      holdMs,
      choiceCount: 1,
      promptText: cfg.amber ? 'Green: walk · Amber: get ready · Red: FREEZE' : 'Green: move · Red: FREEZE',
      speakText: cfg.amber
        ? 'Green means walk. Amber means get ready. Red means freeze.'
        : 'Move on green. Freeze on red.',
      answerLabel: 'froze on red',
    }
  }

  function setLight(next, now) {
    if (light === next) return
    light = next
    lightChangedAt = now
    flashColor = next === 'red' ? PALETTE.red : next === 'amber' ? PALETTE.yellow : PALETTE.green
    flashUntil = now + 520
    if (next === 'red') {
      api.sfx.stop()
      api.haptic('warn')
      api.banner('FREEZE!', 900, PALETTE.red)
      api.setPrompt({ main: 'FREEZE!', sub: 'Hold very still' })
      void api.say('Red! Freeze!', { main: 'FREEZE!', sub: 'Hold very still' })
      hold.reset()
    } else if (next === 'amber') {
      api.sfx.tick()
      api.haptic('tick')
      api.banner('GET READY', 800, PALETTE.yellow)
      api.setPrompt({ main: 'Get ready…', sub: 'Red is coming' })
      void api.say('Amber. Get ready.', { main: 'Get ready…' })
    } else {
      api.sfx.go()
      api.haptic('start')
      api.banner('GO!', 700, PALETTE.green)
      api.setPrompt({ main: 'Move!', sub: 'Wave your arms, march on the spot' })
      void api.say('Green! Move!', { main: 'Move!' })
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    api.setPrompt({ main: trial.promptText, sub: '' })
    void api.say(trial.speakText, { main: trial.promptText })
    machine.clock.after(cfg.mode === 'lights' ? 1800 : 1200, () => {
      machine.setPhase('respond')
      if (cfg.mode === 'lights') setLight('green', machine.clock.now())
    })
  }

  const module = {
    requires: cfg.mode === 'wait' ? 'hand' : 'both',

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
      const hands = handsFor(frame, s)
      const pointers = pointersFor(frame, s)
      trail.push(pointers[0])
      machine.reach.step(hands[0] || null, now)
      if (machine.phase !== 'respond') return

      // ── Wait for It ──
      if (cfg.mode === 'wait') {
        const elapsed = machine.phaseElapsed
        if (!armed && elapsed >= machine.trial.armAt) {
          armed = true
          target.color = 'green'
          api.sfx.go()
          api.haptic('start')
          api.setPrompt({ main: 'NOW! Touch it!', sub: '' })
          // The reach clock restarts at the signal: latency before the signal
          // is not reaction time, it is anticipation.
          machine.reach.reset(now)
        }
        const res = selector.step([target], pointers, { dt, now, stageW, stageH })
        if (res.selected) {
          if (armed) {
            machine.resolve({
              accuracy: OUTCOME.CORRECT,
              chosenId: target.id,
              target,
              at: { x: target.x, y: target.y },
              extra: { waitedMs: Math.round(machine.trial.armAt) },
            })
            api.setPrompt({ main: 'Great waiting!', sub: '' })
          } else {
            // Went early. A false alarm, and the trial restarts the wait.
            machine.resolve({
              accuracy: OUTCOME.FALSE_ALARM,
              chosenId: target.id,
              target,
              note: 'responded-before-signal',
              extra: { earlyByMs: Math.round(machine.trial.armAt - elapsed) },
            })
            api.setPrompt({ main: 'Wait for the green!', sub: 'It was not ready yet' })
            void api.say('Wait for the green light', { main: 'Wait for the green!' })
          }
          return
        }
        if (machine.window?.expired()) {
          machine.resolve({
            accuracy: armed ? OUTCOME.OMISSION : OUTCOME.CORRECT_INHIBIT,
            timedOut: true,
            target,
            note: armed ? null : 'never-went-early',
          })
        }
        return
      }

      // ── Calm Movement ──
      if (cfg.mode === 'calm') {
        // A child who never finds the gentle band would otherwise sit here for
        // ever, so the window closes the trial as "almost" rather than nothing.
        if (machine.window?.expired()) {
          const avg = moveSamples.length
            ? moveSamples.reduce((a, b) => a + b, 0) / moveSamples.length
            : 0
          machine.resolve({
            accuracy: progress > 0.4 ? OUTCOME.NEAR : OUTCOME.OMISSION,
            timedOut: true,
            target: { x: 0.5, y: 0.4, color: 'teal' },
            extra: { holdBreaks: breaches, movementMagnitude: Math.round(avg * 1000) / 1000 },
            note: avg >= 1.0 ? 'too-vigorous' : avg <= 0.25 ? 'too-still' : null,
          })
          api.setPrompt({
            main: avg >= 1.0 ? 'A bit gentler next time.' : 'Keep those arms moving next time.',
            sub: '',
          })
          return
        }
        const mag = motion.step(frame.pose, now)
        moveSamples.push(mag)
        if (moveSamples.length > 400) moveSamples.shift()
        // Moving, but gently: too still is not the goal either, so the target is
        // a band rather than a ceiling.
        const inBand = mag > 0.25 && mag < 1.0
        const r = hold.step(inBand, dt)
        progress = r.progress
        if (r.justBroke) {
          breaches++
          api.sfx.tick()
          api.haptic('tick')
          api.setPrompt({
            main: mag >= 1.0 ? 'A little softer…' : 'Keep moving gently',
            sub: '',
          })
        }
        if (r.justCompleted) {
          const avg = moveSamples.reduce((a, b) => a + b, 0) / moveSamples.length
          machine.resolve({
            accuracy: breaches <= 2 ? OUTCOME.CORRECT : OUTCOME.NEAR,
            chosenId: 'calm',
            target: { x: 0.5, y: 0.4, color: 'teal' },
            at: { x: 0.5, y: 0.4 },
            extra: { holdBreaks: breaches, movementMagnitude: Math.round(avg * 1000) / 1000 },
          })
          api.setPrompt({ main: 'Lovely and calm.', sub: '' })
        }
        return
      }

      // ── Red Light / Green Light ──
      const mag = motion.step(frame.pose, now)
      if (!frame.bodyPresent) {
        api.setPrompt({ main: 'Step back so I can see you', sub: '' })
        return
      }

      const sinceChange = now - lightChangedAt

      if (light === 'green') {
        moveSamples.push(mag)
        if (moveSamples.length > 300) moveSamples.shift()
        // Green lasts a random 2-5 s so the child cannot predict the change.
        const greenFor = 2000 + ((machine.index * 977) % 3000)
        if (sinceChange > greenFor) setLight(cfg.amber ? 'amber' : 'red', now)
        return
      }

      if (light === 'amber') {
        if (sinceChange > 1100) setLight('red', now)
        return
      }

      // Red: judge the freeze.
      freezeSamples.push(mag)
      if (freezeSamples.length > 300) freezeSamples.shift()
      const still = mag < FREEZE_LIMIT
      const r = hold.step(still, dt)
      progress = r.progress
      if (r.justBroke) {
        breaches++
        api.sfx.tick()
        api.haptic('tick')
        api.setPrompt({ main: 'Freeze! Hold still.', sub: '' })
      }
      if (r.justCompleted) {
        const moved = moveSamples.length
          ? moveSamples.reduce((a, b) => a + b, 0) / moveSamples.length
          : 0
        // Did they actually move on green? A child who stood still throughout
        // has not demonstrated inhibition, only stillness.
        const reallyMoved = moved > MOVING_MIN
        const clean = breaches === 0
        machine.resolve({
          accuracy: clean && reallyMoved ? OUTCOME.CORRECT_INHIBIT : clean ? OUTCOME.NEAR : OUTCOME.FALSE_ALARM,
          chosenId: 'freeze',
          target: { x: 0.5, y: 0.4, color: clean ? 'green' : 'orange' },
          at: { x: 0.5, y: 0.4 },
          note: reallyMoved ? null : 'did-not-move-on-green',
          extra: {
            holdBreaks: breaches,
            movementOnGreen: Math.round(moved * 1000) / 1000,
            movementOnRed:
              Math.round(
                (freezeSamples.reduce((a, b) => a + b, 0) / Math.max(freezeSamples.length, 1)) * 1000
              ) / 1000,
          },
        })
        api.setPrompt({
          main: clean ? 'Perfect freeze!' : 'Good try — hold a bit longer next time.',
          sub: reallyMoved ? '' : 'Remember to move on green!',
        })
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const p = pulse(now)

      if (cfg.mode === 'lights') {
        drawTrafficLight(view, light, cfg.amber, p, s)
        if (light === 'red') drawFreezeMeter(view, progress, s)
      } else if (cfg.mode === 'calm') {
        drawCalmBand(view, motion?.value() ?? 0, progress)
      } else if (target) {
        drawTarget(view, target, {
          progress: selector ? selector.progressOf(target.id) : 0,
          hover: selector?.hovered === target.id,
          pulse: armed ? 1 : p * 0.25,
          highlight: armed,
          reducedMotion: s.reducedMotion,
          highContrast: s.highContrast,
        })
        drawWaitLamp(view, armed, p, s)
      }

      if (frame.pose && (cfg.mode !== 'wait')) {
        const still = (motion?.value() ?? 0) < FREEZE_LIMIT
        drawSkeleton(view, frame.pose.lm, POSE_BONES, {
          color:
            light === 'red'
              ? still
                ? hexA(PALETTE.green, 0.9)
                : hexA(PALETTE.orange, 0.9)
              : 'rgba(126,232,255,0.6)',
          joints: true,
          lineWidth: Math.max(3, view.short * 0.008),
        })
      }
      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.5)' : 'rgba(255,217,61,0.5)',
          })
        }
      }
      if (cfg.mode === 'wait') {
        for (const h of frame.hands) {
          drawHandCursor(view, h, { trail: trail.points, reducedMotion: s.reducedMotion })
        }
      }

      if (flashColor && now < flashUntil && !s.reducedMotion) {
        edgeFlash(view, flashColor, (flashUntil - now) / 520)
      }
    },

    onResume() {
      // A pause during red would otherwise bank free freeze time.
      if (cfg.mode === 'lights' && light === 'red') hold?.reset()
      if (cfg.mode === 'lights') lightChangedAt = api.clock.now()
    },

    unmount() {
      motion?.reset()
      selector?.reset()
      machine = null
      target = null
    },
  }

  return module
}

/** A real traffic light, because the transfer target is a real traffic light. */
function drawTrafficLight(view, light, withAmber, p, s) {
  const ctx = view.ctx
  const r = view.short * 0.042
  const gap = r * 2.5
  const lamps = withAmber ? ['red', 'amber', 'green'] : ['red', 'green']
  const boxH = gap * lamps.length + r
  const boxW = r * 3
  const x = view.w * 0.5 - boxW / 2
  const y = view.h * 0.1

  ctx.save()
  ctx.fillStyle = 'rgba(6,10,22,0.82)'
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 3
  roundRect(ctx, x, y, boxW, boxH, r * 0.7)
  ctx.fill()
  ctx.stroke()

  const colors = { red: PALETTE.red, amber: PALETTE.yellow, green: PALETTE.green }
  lamps.forEach((name, i) => {
    const cy = y + r * 0.9 + i * gap
    const cx = x + boxW / 2
    const on = light === name
    if (on && !s.reducedMotion) {
      const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.4)
      g.addColorStop(0, hexA(colors[name], 0.55))
      g.addColorStop(1, hexA(colors[name], 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r * (on ? 0.95 + p * 0.05 : 0.8), 0, Math.PI * 2)
    ctx.fillStyle = on ? colors[name] : hexA(colors[name], 0.14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 2
    ctx.stroke()
  })
  ctx.restore()
}

function drawFreezeMeter(view, progress, s) {
  const ctx = view.ctx
  const w = view.w * 0.42
  const h = Math.max(12, view.short * 0.028)
  const x = view.w / 2 - w / 2
  const y = view.h * 0.9
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = PALETTE.green
  roundRect(ctx, x, y, Math.max(h, w * clamp(progress, 0, 1)), h, h / 2)
  ctx.fill()
  ctx.font = `800 ${h * 0.85}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.fillText('HOLD STILL', view.w / 2, y - h * 0.55)
  ctx.restore()
  void s
}

function drawCalmBand(view, mag, progress) {
  const ctx = view.ctx
  const w = view.w * 0.5
  const h = Math.max(14, view.short * 0.032)
  const x = view.w / 2 - w / 2
  const y = view.h * 0.88
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  // The gentle band: too still on the left, too wild on the right.
  const from = 0.25 / 2.4
  const to = 1.0 / 2.4
  ctx.fillStyle = hexA(PALETTE.teal, 0.4)
  ctx.fillRect(x + w * from, y, w * (to - from), h)
  const pos = clamp(mag / 2.4, 0, 1)
  ctx.fillStyle = pos >= from && pos <= to ? PALETTE.teal : PALETTE.yellow
  ctx.fillRect(x + w * pos - 3, y - 5, 6, h + 10)
  ctx.font = `700 ${h * 0.55}px Fredoka, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'left'
  ctx.fillText('too still', x, y - h * 0.4)
  ctx.textAlign = 'right'
  ctx.fillText('too wild', x + w, y - h * 0.4)
  ctx.textAlign = 'center'
  ctx.fillStyle = PALETTE.teal
  ctx.fillText(`${Math.round(progress * 100)}%`, view.w / 2, y + h * 1.7)
  ctx.restore()
}

function drawWaitLamp(view, armed, p, s) {
  const ctx = view.ctx
  const r = view.short * 0.05
  const cx = view.w / 2
  const cy = view.h * 0.14
  ctx.save()
  if (armed && !s.reducedMotion) {
    const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6)
    g.addColorStop(0, hexA(PALETTE.green, 0.6))
    g.addColorStop(1, hexA(PALETTE.green, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * (armed ? 1 + p * 0.06 : 0.82), 0, Math.PI * 2)
  ctx.fillStyle = armed ? PALETTE.green : 'rgba(255,255,255,0.16)'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.stroke()
  ctx.font = `800 ${r * 0.5}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = armed ? '#04140b' : 'rgba(255,255,255,0.7)'
  ctx.fillText(armed ? 'GO' : 'WAIT', cx, cy)
  ctx.restore()
}
