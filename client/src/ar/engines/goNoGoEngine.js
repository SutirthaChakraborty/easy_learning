/**
 * GO / NO-GO — response inhibition and cognitive flexibility.
 *
 * One stimulus at a time. Touch it when it belongs to the "go" category;
 * keep your hands away when it does not. Powers Go/No-Go Animals, Rule Switch
 * (the go category changes mid-round) and Safe or Unsafe under time pressure.
 *
 * Four distinct outcomes, all of which mean different things clinically:
 *   go + touched      → CORRECT
 *   go + no touch     → OMISSION        (inattention, or motor too slow)
 *   no-go + touched   → FALSE_ALARM     (the inhibition failure — the headline)
 *   no-go + no touch  → CORRECT_INHIBIT (a success that looks like nothing)
 *
 * Withholding correctly is celebrated, quietly. If stopping produced no
 * feedback at all, a child would have no way to learn that stopping was right.
 */
import { OUTCOME } from '../core/telemetry'
import { DwellSelector } from '../core/interactions'
import { layoutSlots, clamp, pick } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, PALETTE, hexA, edgeFlash, roundRect,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail, contactError,
} from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSets } from '../content'

/**
 * @param {object} game `game.config`:
 *   trials       total stimuli (default 18)
 *   goSets       content sets the go items come from
 *   noGoSets     content sets the no-go items come from
 *   goTest       (item) => boolean — overrides the set split (e.g. attrs.safety)
 *   goLabel      what to call the go category, e.g. 'dogs'
 *   noGoLabel    what to call the no-go category
 *   ruleSwitch   true to swap the categories half way (Rule Switch)
 *   holdMs       how long a no-go stimulus must be *left alone* to count
 */
export function goNoGoEngine(game) {
  const cfg = {
    trials: 18,
    goSets: ['animals'],
    noGoSets: ['animals'],
    goLabel: 'the go one',
    noGoLabel: 'the other one',
    ruleSwitch: false,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let selector = null
  const trail = new Trail(14)
  let target = null
  let isGo = true
  let switched = false
  let ruleFlipAt = null
  let flashColor = null
  let flashUntil = 0
  let inhibitGlow = 0

  /** Current category labels, which the Rule Switch variant swaps. */
  function labels() {
    return switched
      ? { go: cfg.noGoLabel, noGo: cfg.goLabel }
      : { go: cfg.goLabel, noGo: cfg.noGoLabel }
  }

  /**
   * Is this item currently a "go"? `goTest` wins, then a category list.
   * The Rule Switch variant inverts the answer rather than re-picking pools, so
   * the identical stimulus set carries both rules — which is the whole point:
   * the child has to update the rule, not learn new pictures.
   */
  function classify(item) {
    const base = cfg.goTest
      ? Boolean(cfg.goTest(item))
      : (cfg.goCats || []).some((c) => (item.cats || []).includes(c))
    return switched ? !base : base
  }

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: level.targetSize ?? 0.12, windowMs: level.windowMs || 2600 }, s)

    if (cfg.ruleSwitch && ruleFlipAt === null) {
      // Flip a little past halfway, so the first rule is genuinely established
      // before it is pulled away — that is what makes the switch cost visible.
      ruleFlipAt = Math.floor(cfg.trials * 0.55)
    }
    if (cfg.ruleSwitch && index === ruleFlipAt && !switched) {
      switched = true
      const l = labels()
      api.banner('NEW RULE!', 1400, PALETTE.yellow)
      api.sfx.levelUp()
      api.haptic('start')
      void api.say(`New rule! Now touch ${l.go}. Do not touch ${l.noGo}.`, {
        main: 'New rule!',
        sub: `Touch ${l.go} · leave ${l.noGo}`,
      })
    }

    const goPool = getSets(cfg.goSets).filter((i) => classify(i))
    const noGoPool = getSets(cfg.noGoSets).filter((i) => !classify(i))
    if (!goPool.length || !noGoPool.length) return null

    const noGoRate = level.noGoRate ?? 0.3
    // Deterministic-ish mix: never three no-go trials in a row, which would
    // stop being an inhibition task and start being a waiting task.
    const forceGo = machine && machine.results.slice(-2).every((r) => r.rule === 'noGo')
    isGo = forceGo ? true : api.rng() > noGoRate

    const item = pick(isGo ? goPool : noGoPool, api.rng)
    const box = api.reachBox(level.eccentricity ?? 1)
    const slot = layoutSlots(1, box, spec.radius, api.rng)[0]
    ;[target] = makeTargets([item], [slot], { radius: spec.radius, spriteKind: 'emoji', captions: true })
    target.color = isGo ? 'green' : 'red'

    selector = new DwellSelector({ dwellMs: Math.min(spec.dwellMs, 200) })
    inhibitGlow = 0

    return {
      targetId: item.id,
      radius: spec.radius,
      windowMs: spec.windowMs,
      rule: isGo ? 'go' : 'noGo',
      ruleSwitched: switched,
      choiceCount: 1,
      isGo,
      labels: labels(),
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    const l = trial.labels
    api.setPrompt({ main: `Touch ${l.go}`, sub: `Leave ${l.noGo} alone` })
    // The stimulus is up almost immediately: a long prompt phase would let the
    // child pre-plan and the task would stop measuring inhibition.
    machine.clock.after(280, () => {
      api.sfx.appear(trial.isGo ? 4 : -3)
      machine.setPhase('respond')
    })
  }

  const module = {
    requires: 'hand',

    difficultySnapshot() {
      const { level, promptStage } = resolveDifficulty(game)
      return { ...level, promptStage }
    },

    mount(a) {
      api = a
      switched = false
      ruleFlipAt = null
      machine = new TrialMachine({
        api,
        totalTrials: cfg.trials,
        build: buildTrial,
        onPhase,
        feedbackMs: 850,
      })
      api.setHud({ total: cfg.trials })
      const l = labels()
      void api.say(`Touch ${l.go}. Do not touch ${l.noGo}.`, {
        main: `Touch ${l.go}`,
        sub: `Leave ${l.noGo} alone`,
      })
      machine.clock.after(1600, () => machine.next())
    },

    update(f) {
      if (!machine || machine.ended || !machine.trial) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      const hands = handsFor(frame, s)
      trail.push(pointers[0])
      machine.reach.step(hands[0] || null, now)

      if (machine.phase !== 'respond') return

      // Correctly withholding: reward the *effort* of holding back with a
      // growing calm glow, so "doing nothing" is visibly the right answer.
      if (!machine.trial.isGo) {
        inhibitGlow = clamp(inhibitGlow + dt * 1.4, 0, 1)
      }

      const res = selector.step([target], pointers, { dt, now, stageW, stageH })

      if (machine.window?.expired()) {
        if (machine.trial.isGo) {
          flashColor = null
          machine.resolve({
            accuracy: OUTCOME.OMISSION,
            timedOut: true,
            target,
            chosenId: null,
          })
          api.setPrompt({ main: 'That one was a "touch it".', sub: target.item.label })
        } else {
          flashColor = PALETTE.green
          flashUntil = now + 500
          machine.resolve({
            accuracy: OUTCOME.CORRECT_INHIBIT,
            target,
            chosenId: null,
            note: 'withheld',
          })
          api.setPrompt({ main: 'Great stopping!', sub: `You left the ${target.item.label.toLowerCase()} alone` })
        }
        return
      }

      if (res.selected) {
        const err = contactError(res.pointer, target, stageW, stageH)
        if (machine.trial.isGo) {
          machine.resolve({
            accuracy: OUTCOME.CORRECT,
            chosenId: target.id,
            target,
            contactError: err,
            at: { x: target.x, y: target.y },
          })
          api.setPrompt({ main: 'Yes!', sub: target.item.label })
        } else {
          flashColor = PALETTE.orange
          flashUntil = now + 420
          machine.resolve({
            accuracy: OUTCOME.FALSE_ALARM,
            chosenId: target.id,
            target,
            contactError: err,
          })
          const l = machine.trial.labels
          api.setPrompt({ main: `Only ${l.go}!`, sub: `Leave ${l.noGo} alone` })
          void api.say(`Only touch ${l.go}`, { main: `Only ${l.go}!` })
        }
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !target) return
      const s = getSettings()
      const p = pulse(now)
      const responding = machine.phase === 'respond'

      // A "leave it alone" halo around a no-go stimulus, growing while the child
      // holds back.
      if (responding && !machine.trial.isGo && inhibitGlow > 0.02 && !s.reducedMotion) {
        const ctx = view.ctx
        const r = view.pr(target.radius) * (1.6 + inhibitGlow * 0.8)
        const g = ctx.createRadialGradient(
          view.px(target.x), view.py(target.y), view.pr(target.radius),
          view.px(target.x), view.py(target.y), r
        )
        g.addColorStop(0, hexA(PALETTE.teal, 0))
        g.addColorStop(1, hexA(PALETTE.teal, 0.3 * inhibitGlow))
        ctx.save()
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(view.px(target.x), view.py(target.y), r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      drawTarget(view, target, {
        progress: responding ? selector.progressOf(target.id) : 0,
        hover: responding && selector.hovered === target.id,
        pulse: p,
        highlight: responding && machine.trial.isGo && machine.prompt?.highlightTarget === true,
        correct: machine.phase === 'feedback' && machine.lastOutcome === OUTCOME.CORRECT,
        wrong: machine.phase === 'feedback' && machine.lastOutcome === OUTCOME.FALSE_ALARM,
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
      })

      // A persistent legend: the rule must be re-readable at any moment,
      // especially right after a switch.
      if (machine.trial?.labels) {
        const ctx = view.ctx
        const fs = Math.max(11, view.short * 0.026)
        ctx.save()
        ctx.font = `700 ${fs}px Fredoka, system-ui, sans-serif`
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        const y = view.h - fs * 2.2
        const chip = (text, color, x) => {
          const w = ctx.measureText(text).width + fs * 1.6
          ctx.fillStyle = hexA(color, 0.22)
          ctx.strokeStyle = hexA(color, 0.7)
          ctx.lineWidth = 2
          roundRect(ctx, x, y - fs, w, fs * 2, fs)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.fillText(text, x + fs * 0.8, y)
          return x + w + fs * 0.5
        }
        let x = view.short * 0.03
        x = chip(`✋ ${machine.trial.labels.go}`, PALETTE.green, x)
        chip(`⛔ ${machine.trial.labels.noGo}`, PALETTE.red, x)
        ctx.restore()
      }

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

      if (flashColor && now < flashUntil && !s.reducedMotion) {
        edgeFlash(view, flashColor, (flashUntil - now) / 500)
      }
    },

    unmount() {
      selector?.reset()
      machine = null
      target = null
    },
  }

  return module
}
