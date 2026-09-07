/**
 * RHYTHM REACH — motor timing, and the platform's most quantitative measure.
 *
 * A target pulses on a steady beat. The child touches it in time. What gets
 * recorded is the *signed* temporal error:
 *
 *     timingError = contactTime − beatTime      (negative = early)
 *
 * Two numbers come out of a round, and they mean different things:
 *   median error       a constant lag. Mostly uninteresting — it is an offset,
 *                      and part of it is our own pipeline.
 *   variability (SD)   how *consistent* the child is. This is the meaningful
 *                      one, and it is immune to any fixed offset.
 *
 * Pipeline latency is measured, not assumed: the tracker reports real capture
 * timestamps via requestVideoFrameCallback where the browser provides them, and
 * that measured lag is subtracted before the error is stored. `pipeline` on the
 * session records exactly what was subtracted, so the number is auditable
 * rather than a black box.
 *
 * Scoring is graded — perfect / close / early / late — never a bare hit-or-zero.
 * A child with slower processing must be able to see themselves improving from
 * "late" to "close" instead of collecting zeroes.
 */
import { OUTCOME } from '../core/telemetry'
import { layoutSlots, clamp, aspectDist, pick } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawBeatRing, PALETTE, hexA, colorOf,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import { pointersFor, makeTargets, pulse, Trail } from './base'
import { resolveDifficulty, recordTrialOutcome, describeStep } from '../core/adaptive'
import { getSet } from '../content'

/** Grading bands, in ms of absolute error. Generous by design. */
const BANDS = [
  { max: 110, label: 'Perfect!', points: 10, kind: 'perfect' },
  { max: 220, label: 'Great!', points: 7, kind: 'great' },
  { max: 380, label: 'Close!', points: 4, kind: 'close' },
  { max: Infinity, label: 'Keep going!', points: 1, kind: 'off' },
]

export function rhythmEngine(game) {
  const cfg = {
    beats: 24,
    /** How many beats of metronome before scoring starts. */
    leadInBeats: 4,
    moveTargetEvery: 4,
    sets: ['shapes'],
    ...(game.config || {}),
  }

  let api = null
  let level = null
  let promptStage = 'A'
  let prompt = null
  let target = null
  let radius = 0.13
  let periodMs = 900

  let beatIndex = -1
  let nextBeatAt = 0
  let scoredBeats = 0
  let armed = false // has the child left the target since the last hit
  let lastHitBeat = -1
  let inTarget = false
  let wasInTarget = false
  let results = []
  let score = 0
  let streak = 0
  let bestStreak = 0
  let lastGrade = null
  let lastGradeUntil = 0
  let ended = false
  const trail = new Trail(18)

  function placeTarget() {
    const box = api.reachBox(level.eccentricity ?? 1)
    const item = pick(getSet(cfg.sets[0]) , api.rng)
    const slot = layoutSlots(1, box, radius, api.rng)[0]
    ;[target] = makeTargets([item], [slot], { radius, spriteKind: 'shape' })
    target.color = 'purple'
  }

  /**
   * Records one beat. `errorMs` is null when the beat was missed entirely.
   * A miss is an OMISSION (no response), never a wrong answer — there was no
   * decision to get wrong.
   */
  function scoreBeat(errorMs, hand, contactError) {
    const grade = errorMs == null ? null : BANDS.find((b) => Math.abs(errorMs) <= b.max)
    const accuracy =
      errorMs == null
        ? OUTCOME.OMISSION
        : grade.kind === 'off'
          ? OUTCOME.NEAR // on the beat-ish: right idea, imprecise timing
          : OUTCOME.CORRECT

    api.recorder.trial({
      accuracy,
      promptLevel: promptStage,
      prompted: Boolean(prompt?.showAnimatedHand),
      targetId: target?.id ?? null,
      chosenId: errorMs == null ? null : target?.id ?? null,
      timingErrorMs: errorMs,
      // Timing tasks have no "decision latency" — the beat IS the cue, so the
      // signed error carries all the information. Leaving latencyMs null keeps
      // it out of the median-latency statistic where it would be meaningless.
      latencyMs: null,
      movementTimeMs: null,
      hand,
      contactError,
      windowMs: Math.round(periodMs),
      pipelineLatencyMs: api.pipelineLatency(),
      note: grade?.kind ?? 'miss',
    })

    if (errorMs == null) {
      streak = 0
      api.sfx.neutral()
    } else {
      score += grade.points
      if (grade.kind === 'perfect' || grade.kind === 'great') {
        streak++
        bestStreak = Math.max(bestStreak, streak)
      } else streak = 0
      lastGrade = { ...grade, errorMs }
      lastGradeUntil = api.clock.now() + 700
      if (grade.kind === 'off') {
        api.sfx.almost()
        api.haptic('almost')
      } else {
        api.sfx.correct(Math.min(streak, 5))
        api.haptic('correct')
      }
      if (!getSettings().reducedMotion && target) {
        api.particles.burst(target.x, target.y, colorOf(grade.kind === 'perfect' ? 'green' : 'yellow'))
      }
    }

    results.push(errorMs)
    scoredBeats++

    // Feed the same adaptive ladder every other engine uses, so pace steps up
    // once the child is landing inside the "great" band consistently.
    const fb = recordTrialOutcome(game, {
      accuracy,
      prompted: false,
      latencyMs: null,
      timedOut: errorMs == null,
    })
    const step = describeStep(fb.stepped)
    api.setHud({
      trial: scoredBeats,
      total: cfg.beats,
      score,
      streak,
      promptStage: fb.promptStage,
      step,
    })
    if (fb.stepped) {
      api.recorder.event('difficultyStep', fb.stepped)
      // Re-read the pace immediately: the point of a timing task is that the
      // tempo tracks the child.
      const next = resolveDifficulty(game)
      level = next.level
      periodMs = paceToPeriod(level.pace ?? 60)
    }

    if (scoredBeats >= cfg.beats) finish()
  }

  function finish() {
    if (ended) return
    ended = true
    api.finish({ outcome: 'completed', bestStreak, score })
  }

  const paceToPeriod = (bpm) => clamp(60000 / clamp(bpm, 24, 160), 380, 2400)

  const module = {
    requires: 'hand',

    difficultySnapshot() {
      const d = resolveDifficulty(game)
      return { ...d.level, promptStage: d.promptStage }
    },

    mount(a) {
      api = a
      const d = resolveDifficulty(game)
      level = d.level
      prompt = d.prompt
      promptStage = d.promptStage
      api.recorder.setPromptStage(promptStage)

      const spec = accommodate({ radius: level.targetSize ?? 0.13 }, getSettings())
      radius = Math.max(spec.radius, 0.1) // a moving-time task needs a fair target
      periodMs = paceToPeriod(level.pace ?? 60)
      placeTarget()

      api.setHud({ total: cfg.beats, trial: 0, score: 0, streak: 0, promptStage })
      api.setPrompt({ main: 'Touch on every beat', sub: 'Listen for the click' })
      void api.say('Touch the shape on every beat', {
        main: 'Touch on every beat',
        sub: 'Listen for the click',
      })

      // Lead-in: the metronome runs alone so the child can internalise the
      // tempo before anything is scored.
      beatIndex = -cfg.leadInBeats
      nextBeatAt = api.clock.now() + 1500
    },

    update(f) {
      if (ended) return
      const { frame, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      trail.push(pointers[0])

      // ── the beat ──
      if (now >= nextBeatAt) {
        beatIndex++
        const isBar = ((beatIndex % 4) + 4) % 4 === 0
        api.sfx.beat(isBar)
        api.haptic('beat')

        if (beatIndex === 0) {
          api.banner('GO!', 600, PALETTE.green)
          api.setPrompt({ main: 'Touch on every beat', sub: '' })
        }
        // A miss is only scored once the previous beat's window has fully
        // closed, so a slightly late touch still counts against the beat it
        // was aimed at rather than being lost.
        if (beatIndex > 0 && lastHitBeat < beatIndex - 1 && scoredBeats < cfg.beats) {
          scoreBeat(null, null, null)
        }
        if (beatIndex > 0 && beatIndex % cfg.moveTargetEvery === 0) {
          placeTarget()
          api.sfx.whoosh()
          armed = true
        }
        nextBeatAt += periodMs
      }

      // ── contact detection ──
      wasInTarget = inTarget
      inTarget = false
      let activeHand = null
      for (const p of pointers) {
        if (!target) break
        const d = aspectDist(p, target, stageW, stageH)
        if (d <= target.radius * 1.15) {
          inTarget = true
          activeHand = p
          break
        }
      }
      // Rearm once the hand has left, so resting a finger on the target does
      // not auto-score every beat.
      if (!inTarget && wasInTarget) armed = true
      if (beatIndex < 0) armed = true

      const isNewContact = inTarget && !wasInTarget && armed
      if (isNewContact && beatIndex >= 0 && scoredBeats < cfg.beats) {
        armed = false
        // Which beat was this aimed at? The nearest one, so an early touch is
        // credited to the beat it anticipated rather than the previous one.
        const thisBeatAt = nextBeatAt - periodMs
        const errToThis = now - thisBeatAt
        const errToNext = now - nextBeatAt
        const aimedNext = Math.abs(errToNext) < Math.abs(errToThis)
        const beatFor = aimedNext ? beatIndex + 1 : beatIndex
        const raw = aimedNext ? errToNext : errToThis

        if (beatFor > lastHitBeat) {
          lastHitBeat = beatFor
          // Subtract the measured pipeline lag: we want the child's timing, not
          // ours. `pipeline` on the session records what was removed.
          const corrected = Math.round(raw - api.pipelineLatency())
          const err = contactErrorFor(activeHand, target, stageW, stageH)
          scoreBeat(corrected, activeHand?.side ?? null, err)
        }
      }
    },

    render(f) {
      const { view, frame, now } = f
      const s = getSettings()
      if (!target) return
      const p = pulse(now, periodMs)

      // The ring collapses onto the target and is smallest exactly on the beat,
      // which gives the child a visual channel for the tempo as well as audio.
      const sinceBeat = now - (nextBeatAt - periodMs)
      const progress = clamp(sinceBeat / periodMs, 0, 1)
      drawBeatRing(view, target, progress, { color: PALETTE.yellow })

      drawTarget(view, target, {
        progress: 0,
        hover: inTarget,
        pulse: progress > 0.88 || progress < 0.08 ? 1 : p * 0.3,
        highlight: progress > 0.9 || progress < 0.06,
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
      })

      // Graded feedback text, so "close" is visibly different from "perfect".
      if (lastGrade && now < lastGradeUntil) {
        const ctx = view.ctx
        const a = (lastGradeUntil - now) / 700
        const early = lastGrade.errorMs < 0
        ctx.save()
        ctx.globalAlpha = a
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const size = view.short * 0.06
        ctx.font = `800 ${size}px Fredoka, system-ui, sans-serif`
        const y = view.py(target.y) - view.pr(target.radius) - size * (1.4 - a * 0.4)
        const colour =
          lastGrade.kind === 'perfect'
            ? PALETTE.green
            : lastGrade.kind === 'great'
              ? PALETTE.teal
              : lastGrade.kind === 'close'
                ? PALETTE.yellow
                : PALETTE.orange
        ctx.lineWidth = size * 0.16
        ctx.strokeStyle = 'rgba(3,7,18,0.8)'
        ctx.strokeText(lastGrade.label, view.px(target.x), y)
        ctx.fillStyle = colour
        ctx.fillText(lastGrade.label, view.px(target.x), y)

        if (lastGrade.kind !== 'perfect') {
          const hint = early ? '← a bit early' : 'a bit late →'
          ctx.font = `700 ${size * 0.5}px Fredoka, system-ui, sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.8)'
          ctx.fillText(hint, view.px(target.x), y + size * 0.75)
        }
        ctx.restore()
      }

      // Beat strip: the last 12 beats as coloured pips, so a child can see
      // their own consistency building.
      drawBeatStrip(view, results.slice(-12))

      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.5)' : 'rgba(255,217,61,0.5)',
          })
        }
      }
      for (const h of frame.hands) {
        drawHandCursor(view, h, { trail: h === frame.hands[0] ? trail.points : null, reducedMotion: s.reducedMotion })
      }
    },

    onPause() {
      // Restart the beat grid cleanly on resume: an interrupted tempo is worse
      // than a fresh count-in, and a stale nextBeatAt would fire a burst of
      // catch-up beats.
    },

    onResume() {
      nextBeatAt = api.clock.now() + 900
      armed = true
      api.banner('Ready…', 700, PALETTE.yellow)
    },

    unmount() {
      target = null
      ended = true
    },
  }

  return module
}

function contactErrorFor(pointer, target, stageW, stageH) {
  if (!pointer || !target) return null
  const d = aspectDist(pointer, target, stageW, stageH)
  return Math.round((d / (target.radius || 0.1)) * 1000) / 1000
}

function drawBeatStrip(view, errors) {
  if (!errors.length) return
  const ctx = view.ctx
  const w = view.short * 0.02
  const gap = w * 1.6
  const total = errors.length * gap
  const x0 = view.w / 2 - total / 2
  const y = view.h * 0.955
  ctx.save()
  errors.forEach((e, i) => {
    const x = x0 + i * gap
    const colour =
      e == null
        ? 'rgba(255,255,255,0.2)'
        : Math.abs(e) <= 110
          ? PALETTE.green
          : Math.abs(e) <= 220
            ? PALETTE.teal
            : Math.abs(e) <= 380
              ? PALETTE.yellow
              : PALETTE.orange
    ctx.fillStyle = colour
    ctx.beginPath()
    ctx.arc(x, y, w / 2, 0, Math.PI * 2)
    ctx.fill()
    // Early sits left of centre, late sits right — the strip shows drift, not
    // just accuracy.
    if (e != null) {
      ctx.fillStyle = hexA('#ffffff', 0.85)
      ctx.beginPath()
      ctx.arc(x + clamp(e / 900, -0.6, 0.6) * w, y, w * 0.16, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  ctx.restore()
}
