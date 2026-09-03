/**
 * TAP — "touch the right one".
 *
 * The single most reusable interaction in the platform. With different content
 * and different `ask` functions it becomes Find & Touch, Read & Find, Listen &
 * Find, Repair the Sequence, Vanishing Target, Phonics Reach, Number Quantity
 * Match, Big/Small, Safe or Unsafe, Above/Below, Emotion Scenario and What
 * Should I Do — 15 activities, one engine.
 *
 * Trial structure:
 *   reveal? → prompt → respond → feedback
 *
 * `reveal` only exists for memory tasks (a stimulus is shown, then hidden).
 * `prompt` is where the instruction is given and, at prompt stages A/B, the
 * answer is demonstrated. `respond` is the only phase where a touch counts.
 *
 * Outcome rules, which are the clinically load-bearing part:
 *   - first-attempt correct                  → CORRECT
 *   - correct after a wrong touch             → INCORRECT (note: self-corrected),
 *                                               but the child *feels* the gentle
 *                                               "almost" cue, never a failure
 *   - window expired while resting on the
 *     correct answer                          → NEAR (they knew it; too slow)
 *   - window expired elsewhere                → OMISSION
 * A slow but correct answer is never an error.
 */
import { OUTCOME } from '../core/telemetry'
import { DwellSelector } from '../core/interactions'
import { layoutSlots, layoutRow, clamp, fitRadius, ROW_LIMIT } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawDemoHand,
} from '../core/draw'
import { HAND_BONES, POSE_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail,
  contactError, crossedMidline, RETRY_LINES, PRAISE_LINES,
} from './base'
import { resolveDifficulty } from '../core/adaptive'

/**
 * @param {object} game catalogue entry; `game.config` holds:
 *   trials         number of turns (default 10)
 *   makeTrial      (ctx) => TrialSpec — see asks.js for the built-in askers
 *   layout         'scatter' | 'row'  (row for anything order-like)
 *   spriteKind     'emoji' | 'text' | 'shape' | 'dots'
 *   captions       show the item name under each target
 *   retries        how many wrong touches before the trial closes (default 2)
 *   promptHoldMs   minimum time the instruction stays up before touches count
 */
export function tapEngine(game) {
  const cfg = {
    trials: 10,
    layout: 'scatter',
    spriteKind: 'emoji',
    captions: false,
    retries: 2,
    promptHoldMs: 700,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let selector = null
  const trail = new Trail(16)
  let targets = []
  let revealItems = null
  let demoPhase = 0
  let flashUntil = 0
  let feedbackTarget = null
  let feedbackKind = null
  let hoverProgressOnAnswer = 0

  function buildTrial(index, level, prompt) {
    const s = getSettings()
    const spec = accommodate(
      {
        radius: level.targetSize ?? 0.11,
        windowMs: level.windowMs ?? 0,
        showMs: level.showMs ?? 1800,
      },
      s
    )

    const trial = cfg.makeTrial({
      index,
      level,
      prompt,
      rng: api.rng,
      api,
      choices: level.choices ?? 3,
      distractorKind: level.distractors ?? 'related',
    })
    if (!trial) return null

    const options = trial.options || []
    const box = api.reachBox(level.eccentricity ?? 1)
    // Six large bubbles cannot share a screen without touching, and touching
    // bubbles make a selection ambiguous — so the radius gives way to the
    // choice count rather than the other way round.
    const isRow = (trial.layout || cfg.layout) === 'row'
    const radius = fitRadius(options.length, spec.radius, isRow ? ROW_LIMIT : undefined)
    const slots = isRow
      ? layoutRow(options.length, box, trial.rowY ?? 0.5, { radius })
      : layoutSlots(options.length, box, radius, api.rng)

    targets = makeTargets(options, slots, {
      radius,
      spriteKind: trial.spriteKind || cfg.spriteKind,
      captions: trial.captions ?? cfg.captions,
      colors: trial.colors,
    })
    // Explicit per-option positions win (spatial-language trials need them).
    if (trial.positions) {
      trial.positions.forEach((p, i) => {
        if (!targets[i] || !p) return
        targets[i].x = clamp(p.x, 0.06, 0.94)
        targets[i].y = clamp(p.y, 0.08, 0.92)
        if (p.scale) targets[i].radius = radius * p.scale
      })
    }
    // Size-comparison trials draw the same object at two sizes; the size *is*
    // the discriminator, so it is set per target rather than per level.
    if (trial.scaleById) {
      for (const t of targets) {
        const k = trial.scaleById[t.id]
        if (k) t.radius = clamp(radius * k, 0.05, 0.22)
      }
    }
    // A backdrop object (the anchor in a spatial trial) is drawn but not tappable.
    for (const t of targets) if (t.item?.disabled) t.disabled = true

    selector = new DwellSelector({ dwellMs: spec.dwellMs })
    revealItems = trial.reveal ? trial.reveal.items || [trial.reveal.item] : null
    demoPhase = 0
    feedbackTarget = null
    feedbackKind = null
    hoverProgressOnAnswer = 0

    return {
      ...trial,
      targetId: trial.targetId,
      radius,
      windowMs: spec.windowMs,
      showMs: spec.showMs,
      choiceCount: options.length,
      distractorCount: Math.max(0, options.length - 1),
      hasReveal: Boolean(trial.reveal),
    }
  }

  function onPhase(phase, trial) {
    if (!trial) return
    if (phase === 'prompt') {
      if (trial.hasReveal) {
        // Memory task: show the stimulus by itself first, then hide it.
        api.setPrompt({ main: trial.revealPrompt || 'Look carefully…', sub: '' })
        void api.say(trial.revealSpeak || trial.revealPrompt || 'Look carefully', {
          main: trial.revealPrompt || 'Look carefully…',
        })
        machine.clock.after(trial.showMs, () => {
          revealItems = null
          api.sfx.whoosh()
          api.say(trial.promptText, { main: trial.promptText, sub: trial.promptSub, speak: trial.speakText })
          machine.clock.after(cfg.promptHoldMs, () => machine.setPhase('respond'))
        })
        return
      }
      void api.say(trial.promptText, {
        main: trial.promptText,
        sub: trial.promptSub,
        speak: trial.speakText,
      })
      // Some askers play their own audio (a phoneme rather than a word), and
      // must play it *after* the sentence so the two do not overlap.
      if (trial.onPrompt) machine.clock.after(520, () => trial.onPrompt())
      machine.clock.after(cfg.promptHoldMs, () => machine.setPhase('respond'))
    }
  }

  /**
   * Laterality trials ("touch it with your LEFT hand") are only correct when
   * the named hand arrives. The wrong hand on the right target is a genuine
   * body-awareness error, not a miss — so it is recorded as incorrect with the
   * reason attached, and the child is told which hand to use.
   */
  function handMismatch(trial, pointer) {
    if (!trial.requireHand || !pointer?.side) return false
    return pointer.side !== trial.requireHand
  }

  const module = {
    requires: 'hand',

    difficultySnapshot() {
      const { level, promptStage } = resolveDifficulty(game)
      return { ...level, promptStage }
    },

    mount(a) {
      api = a
      machine = new TrialMachine({
        api,
        totalTrials: cfg.trials,
        build: buildTrial,
        onPhase,
        feedbackMs: 1000,
      })
      api.setHud({ total: cfg.trials, trial: 0, score: 0, streak: 0 })
      machine.next()
    },

    update(f) {
      if (!machine || machine.ended) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      const hands = handsFor(frame, s)
      trail.push(pointers[0])

      demoPhase = (demoPhase + dt / 1.6) % 1

      if (machine.phase !== 'respond') {
        machine.reach.step(hands[0] || null, now)
        return
      }

      machine.reach.step(hands[0] || null, now)

      const res = selector.step(targets, pointers, { dt, now, stageW, stageH })

      // Remember how close they came on the right answer — this is what turns a
      // timeout into "knew it, too slow" instead of "no response".
      const answerProgress = selector.progressOf(machine.trial.targetId)
      hoverProgressOnAnswer = Math.max(hoverProgressOnAnswer, answerProgress)

      if (machine.window?.expired()) {
        // A child resting on the correct answer when the clock ran out DID know
        // the answer. Recording that as "no response" would be a lie about the
        // thing this platform exists to measure.
        const knewIt = hoverProgressOnAnswer > 0.25
        feedbackTarget = targets.find((t) => t.id === machine.trial.targetId)
        feedbackKind = 'reveal'
        machine.resolve({
          accuracy: knewIt ? OUTCOME.NEAR : OUTCOME.OMISSION,
          chosenId: null,
          target: feedbackTarget,
          timedOut: true,
          note: knewIt ? 'correct-target-not-confirmed' : null,
        })
        api.setPrompt({
          main: knewIt ? 'You had it — just a bit more time next go.' : 'Here it is.',
          sub: machine.trial.answerLabel || '',
        })
        return
      }

      if (res.selected) {
        const chosen = res.selected
        const wrongHand = handMismatch(machine.trial, res.pointer)
        const isRight = chosen.id === machine.trial.targetId && !wrongHand
        const err = contactError(res.pointer, chosen, stageW, stageH)
        const cross = crossedMidline(frame, res.pointer, chosen)
        machine.attempts = (machine.attempts || 0) + 1

        if (wrongHand && chosen.id === machine.trial.targetId && machine.attempts < cfg.retries) {
          // Right target, wrong hand: re-open the trial with an explicit cue.
          flashUntil = now + 450
          api.sfx.neutral()
          api.haptic('neutral')
          const line = `Try your ${machine.trial.requireHand} hand.`
          api.setPrompt({ main: line, sub: machine.trial.promptText })
          void api.say(line, { main: line, sub: machine.trial.promptText })
          machine.clock.after(500, () => selector?.unlock(chosen.id))
          return
        }

        if (isRight) {
          feedbackTarget = chosen
          feedbackKind = 'correct'
          const firstTime = machine.attempts === 1
          machine.resolve({
            accuracy: firstTime ? OUTCOME.CORRECT : OUTCOME.INCORRECT,
            feedbackAs: firstTime ? OUTCOME.CORRECT : OUTCOME.NEAR,
            chosenId: chosen.id,
            target: chosen,
            contactError: err,
            crossedMidline: cross,
            note: firstTime ? null : 'self-corrected',
            at: { x: chosen.x, y: chosen.y },
          })
          api.setPrompt({
            main: firstTime
              ? PRAISE_LINES[machine.streak % PRAISE_LINES.length]
              : 'You found it!',
            sub: machine.trial.answerLabel || '',
          })
        } else if (machine.attempts >= cfg.retries) {
          // Out of tries: show the answer rather than leave them guessing.
          feedbackTarget = targets.find((t) => t.id === machine.trial.targetId)
          feedbackKind = 'reveal'
          machine.resolve({
            accuracy: OUTCOME.INCORRECT,
            chosenId: chosen.id,
            target: feedbackTarget,
            contactError: err,
            crossedMidline: cross,
            note: wrongHand ? 'wrong-hand' : null,
            at: { x: chosen.x, y: chosen.y },
          })
          const why = machine.trial.answerWhy
          api.setPrompt({
            main: 'Here it is.',
            sub: why || machine.trial.answerLabel || '',
          })
          void api.say(why || `This one is ${machine.trial.answerLabel || 'the answer'}`, {
            main: 'Here it is.',
            sub: why || machine.trial.answerLabel || '',
          })
        } else {
          // Neutral reset — no buzzer, no lost points, target stays available.
          flashUntil = now + 450
          api.sfx.neutral()
          api.haptic('neutral')
          const line = RETRY_LINES[machine.attempts % RETRY_LINES.length]
          api.setPrompt({ main: line, sub: machine.trial.promptText })
          void api.say(line, { main: line, sub: machine.trial.promptText })
          // Re-arm after a beat so the same accidental hover cannot fire twice.
          machine.clock.after(500, () => selector?.unlock(chosen.id))
        }
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const p = pulse(now)
      const trial = machine.trial
      const stage = machine.prompt || {}

      // Memory reveal: only the stimulus, centred and large.
      if (revealItems) {
        const box = api.reachBox(0.5)
        const slots = layoutRow(revealItems.length, box, 0.5)
        revealItems.forEach((item, i) => {
          drawTarget(
            view,
            {
              id: `reveal-${i}`,
              x: slots[i].x,
              y: slots[i].y,
              radius: trial.radius * 1.35,
              color: item.attrs?.color || PALETTE_FOR(i),
              sprite: revealSprite(item, trial.spriteKind || cfg.spriteKind),
              caption: trial.captions ?? cfg.captions ? item.label : null,
            },
            { pulse: p, highlight: true, reducedMotion: s.reducedMotion, highContrast: s.highContrast }
          )
        })
      } else {
        const responding = machine.phase === 'respond'
        const highlightAnswer =
          machine.phase !== 'feedback' &&
          (stage.highlightTarget === true ||
            (stage.highlightTarget === 'brief' && machine.phaseElapsed < 1400))

        for (const t of targets) {
          const isAnswer = t.id === trial.targetId
          drawTarget(view, t, {
            progress: responding ? selector.progressOf(t.id) : 0,
            hover: responding && selector.hovered === t.id,
            highlight: highlightAnswer && isAnswer,
            pulse: p,
            correct: feedbackKind && isAnswer && machine.phase === 'feedback',
            wrong:
              machine.phase === 'feedback' &&
              feedbackKind === 'reveal' &&
              !isAnswer &&
              t.id === machine.lastChosenId,
            dim: machine.phase === 'feedback' && !isAnswer,
            reducedMotion: s.reducedMotion,
            highContrast: s.highContrast,
          })
        }

        // Prompt stage A: an animated hand travels to the answer.
        if (stage.showAnimatedHand && machine.phase !== 'feedback' && !s.reducedMotion) {
          const answer = targets.find((t) => t.id === trial.targetId)
          if (answer) {
            drawDemoHand(view, { x: answer.x, y: 0.94 }, { x: answer.x, y: answer.y + 0.05 }, demoPhase)
          }
        }
      }

      // The child's own body, so the reach feels embodied rather than abstract.
      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.5)' : 'rgba(255,217,61,0.5)',
            alpha: 0.6,
          })
        }
        if (frame.pose && game.showBody) {
          drawSkeleton(view, frame.pose.lm, POSE_BONES, { color: 'rgba(255,255,255,0.28)' })
        }
      }

      for (const h of frame.hands) {
        drawHandCursor(view, h, {
          trail: h === frame.hands[0] ? trail.points : null,
          reducedMotion: s.reducedMotion,
        })
      }

      if (now < flashUntil && !s.reducedMotion) {
        const k = (flashUntil - now) / 450
        view.ctx.save()
        view.ctx.fillStyle = `rgba(255,255,255,${0.1 * k})`
        view.ctx.fillRect(0, 0, view.w, view.h)
        view.ctx.restore()
      }
    },

    onPause() {
      // Nothing to do: the clock stops, so windows and timers freeze on their own.
    },

    unmount() {
      selector?.reset()
      targets = []
      machine = null
    },
  }

  return module
}

const PALETTE_ORDER = ['blue', 'green', 'orange', 'purple', 'teal', 'pink']
const PALETTE_FOR = (i) => PALETTE_ORDER[i % PALETTE_ORDER.length]

function revealSprite(item, kind) {
  if (item.sprite) return item.sprite
  if (kind === 'shape' && item.shape) return { kind: 'shape', value: item.shape }
  if (item.emoji) return { kind: 'emoji', value: item.emoji }
  if (item.text != null) return { kind: 'text', value: item.text }
  if (item.quantity != null) return { kind: 'dots', value: item.quantity }
  return { kind: 'text', value: item.label }
}
