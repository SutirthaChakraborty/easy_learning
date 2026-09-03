/**
 * SEQUENCE — "touch these in the right order".
 *
 * One engine, six activities:
 *   Simon Reach          the game demonstrates an order, the child repeats it
 *   Copy the Pattern     a colour pattern is shown, then reproduced
 *   Word Builder         reach C-A-T in order
 *   Sentence Order       arrange "I / want / water"
 *   Life-skill routines  handwashing, dressing, morning routine, crossing the road
 *   Toothbrush Sequence  the same engine with a different SEQUENCE entry
 *
 * The important design choice is that a wrong step does not end the trial. The
 * child is told which step comes next and continues, because the goal is to
 * learn the order — not to be tested on it. `firstTryPerfect` is what gets
 * recorded as correct, so the data still says whether they knew it unaided.
 */
import { OUTCOME } from '../core/telemetry'
import { DwellSelector } from '../core/interactions'
import { layoutRow, layoutSlots, clamp, shuffle, sample, pick, fitRadius, ROW_LIMIT } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawDemoHand, PALETTE, hexA, colorOf,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail, contactError,
} from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSet, getSets, spokenName } from '../content'
import { SEQUENCES } from '../content/packs'

const STEP_COLORS = ['blue', 'green', 'orange', 'purple', 'teal', 'pink', 'yellow']

/**
 * @param {object} game `game.config`:
 *   trials      number of sequences to complete (default 6)
 *   mode        'demo'      — the game shows the order first (Simon, Pattern)
 *             | 'routine'   — a known life-skill order, never demonstrated
 *             | 'spell'     — letters of a word, in order
 *             | 'sentence'  — words of a sentence, in order
 *   sequenceIds which SEQUENCES entries to draw from (mode 'routine')
 *   sets        content sets (mode 'demo')
 *   layout      'row' | 'scatter'
 *   showStepNumbers  put 1,2,3 on the tiles once placed
 */
export function sequenceEngine(game) {
  const cfg = {
    trials: 6,
    mode: 'demo',
    layout: 'row',
    sets: ['shapes'],
    sequenceIds: null,
    stepMs: 780,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let selector = null
  const trail = new Trail(14)
  let targets = []
  let order = [] // ids in the correct order
  let placed = [] // ids the child has already got right
  let cursor = 0
  let demoIndex = -1 // which step the demonstration is lighting up
  let demoPhase = 0
  let firstTryPerfect = true
  let wrongCount = 0
  let wrongFlashId = null
  let wrongFlashUntil = 0
  let stepLatencies = []
  let lastStepAt = 0

  function buildTrial(index, level) {
    const s = getSettings()
    const span = clamp(level.memorySpan ? level.memorySpan + 1 : 3, 2, 6)
    const spec = accommodate(
      { radius: level.targetSize ?? 0.105, windowMs: 0, showMs: level.showMs ?? 1400 },
      s
    )

    let items = []
    let promptText = ''
    let speakText = ''
    let sequenceTitle = null

    if (cfg.mode === 'routine') {
      const pool = (cfg.sequenceIds || Object.keys(SEQUENCES))
        .map((id) => SEQUENCES[id])
        .filter(Boolean)
      if (!pool.length) return null
      const seq = pool[index % pool.length]
      sequenceTitle = seq.title
      // Difficulty here is how many steps of the routine are in play, taken
      // from the start so the child always practises the real beginning.
      const stepCount = clamp(span + 1, 3, seq.steps.length)
      items = seq.steps.slice(0, stepCount).map((st, i) => ({
        id: st.id,
        label: st.label,
        emoji: st.emoji,
        cats: ['step'],
        attrs: {},
        _order: i,
      }))
      promptText = seq.prompt || seq.title
      speakText = `${seq.prompt || seq.title}. Touch them in order.`
    } else if (cfg.mode === 'spell') {
      const words = getSet('words').filter((w) => String(w.text).length <= clamp(span + 1, 3, 5))
      const word = pick(words.length ? words : getSet('words'), api.rng)
      items = String(word.text)
        .toUpperCase()
        .split('')
        // A letter may repeat inside a word, so the tile id carries its
        // position — two 'E' tiles must be distinguishable to the selector.
        .map((ch, i) => {
          return {
            id: `${word.id}-${i}-${ch}`,
            label: ch,
            text: ch,
            cats: ['letter'],
            attrs: { initial: ch.toLowerCase() },
            _order: i,
          }
        })
      sequenceTitle = word.label
      promptText = `Spell ${word.label.toUpperCase()}  ${word.emoji || ''}`.trim()
      speakText = `Spell ${spokenName(word)}`
    } else if (cfg.mode === 'sentence') {
      const pool = getSet('sentences').filter((x) => (x.words || []).length <= clamp(span + 1, 3, 5))
      const sent = pick(pool.length ? pool : getSet('sentences'), api.rng)
      items = (sent.words || []).map((w, i) => ({
        id: `${sent.id}-${i}`,
        label: w,
        text: w,
        cats: ['word'],
        attrs: {},
        _order: i,
      }))
      sequenceTitle = sent.label
      promptText = 'Put the words in order'
      speakText = `Make the sentence: ${sent.label}`
    } else {
      // 'demo': an arbitrary order the child could not know, so it must be shown.
      const pool = getSets(cfg.sets)
      items = sample(pool, span, api.rng).map((it, i) => ({ ...it, _order: i }))
      promptText = 'Watch, then copy the order'
      speakText = 'Watch carefully, then touch them in the same order'
    }

    if (items.length < 2) return null

    order = items.map((i) => i.id)
    placed = []
    cursor = 0
    firstTryPerfect = true
    wrongCount = 0
    stepLatencies = []
    lastStepAt = 0

    // Tiles are laid out shuffled: the *order* is the answer, so the positions
    // must not encode it.
    const displayed = shuffle(items, api.rng)
    const box = api.reachBox(level.eccentricity ?? 1)
    const isRow = cfg.layout === 'row'
    const radius = fitRadius(displayed.length, spec.radius, isRow ? ROW_LIMIT : undefined)
    const slots = isRow
      ? layoutRow(displayed.length, box, 0.62, { radius })
      : layoutSlots(displayed.length, box, radius, api.rng)

    targets = makeTargets(displayed, slots, {
      radius,
      spriteKind: cfg.mode === 'spell' || cfg.mode === 'sentence' ? 'text' : 'emoji',
      captions: cfg.mode === 'routine',
      colors: displayed.map((it) => STEP_COLORS[it._order % STEP_COLORS.length]),
    })

    selector = new DwellSelector({ dwellMs: spec.dwellMs })
    demoIndex = -1
    demoPhase = 0

    return {
      targetId: order[0],
      radius,
      windowMs: 0,
      memorySpan: items.length,
      steps: items.length,
      choiceCount: items.length,
      promptText,
      speakText,
      sequenceTitle,
      showMs: spec.showMs,
      needsDemo: cfg.mode === 'demo',
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    api.setPrompt({ main: trial.promptText, sub: trial.sequenceTitle || '' })
    void api.say(trial.promptText, {
      main: trial.promptText,
      sub: trial.sequenceTitle || '',
      speak: trial.speakText,
    })

    if (trial.needsDemo || machine.prompt?.showAnimatedHand) {
      // Light each tile in the correct order — the demonstration.
      let i = 0
      const step = () => {
        demoIndex = i
        api.sfx.appear(i * 2)
        api.haptic('tick')
        i++
        if (i < order.length) machine.clock.after(trial.showMs, step)
        else
          machine.clock.after(trial.showMs, () => {
            demoIndex = -1
            api.sfx.whoosh()
            api.setPrompt({ main: 'Your turn!', sub: 'Touch them in the same order' })
            void api.say('Your turn', { main: 'Your turn!', sub: 'Touch them in the same order' })
            machine.clock.after(500, () => machine.setPhase('respond'))
          })
      }
      machine.clock.after(900, step)
    } else {
      machine.clock.after(1100, () => machine.setPhase('respond'))
    }
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
        feedbackMs: 1200,
      })
      api.setHud({ total: cfg.trials })
      machine.next()
    },

    update(f) {
      if (!machine || machine.ended || !machine.trial) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      const hands = handsFor(frame, s)
      trail.push(pointers[0])
      demoPhase = (demoPhase + dt / 1.5) % 1
      machine.reach.step(hands[0] || null, now)

      if (machine.phase !== 'respond') return
      if (!lastStepAt) lastStepAt = now

      const res = selector.step(targets, pointers, { dt, now, stageW, stageH })
      if (!res.selected) return

      const chosen = res.selected
      const expectedId = order[cursor]

      if (chosen.id === expectedId) {
        placed.push(chosen.id)
        stepLatencies.push(Math.round(now - lastStepAt))
        lastStepAt = now
        cursor++
        chosen.done = true
        chosen.stepNumber = cursor
        api.sfx.collect(cursor)
        api.haptic('tap')
        if (!s.reducedMotion) api.particles.spawn(8, { x: chosen.x, y: chosen.y, speed: 0.35, life: 0.5, size: 3.5, color: colorOf(chosen.color) })

        if (cursor >= order.length) {
          machine.resolve({
            accuracy: firstTryPerfect ? OUTCOME.CORRECT : OUTCOME.INCORRECT,
            feedbackAs: firstTryPerfect ? OUTCOME.CORRECT : OUTCOME.NEAR,
            chosenId: chosen.id,
            target: chosen,
            contactError: contactError(res.pointer, chosen, stageW, stageH),
            note: firstTryPerfect ? null : 'completed-with-help',
            at: { x: chosen.x, y: chosen.y },
            extra: {
              // Per-step timing shows *where* in a routine the child hesitates,
              // which is far more useful than one number for the whole sequence.
              stepLatenciesMs: stepLatencies.join(','),
              stepsCompletedIndependently: order.length - wrongCount,
            },
          })
          api.setPrompt({
            main: firstTryPerfect ? 'Perfect order!' : 'You finished it!',
            sub: machine.trial.sequenceTitle || '',
          })
        } else {
          const nextItem = targets.find((t) => t.id === order[cursor])
          api.setPrompt({
            main: `${cursor + 1} of ${order.length}`,
            sub: machine.trial.sequenceTitle || machine.trial.promptText,
          })
          void nextItem // (the next step is not named unless the child errs)
        }
      } else {
        // Wrong step: name the right one and keep going.
        firstTryPerfect = false
        wrongCount++
        wrongFlashId = chosen.id
        wrongFlashUntil = now + 500
        api.sfx.neutral()
        api.haptic('neutral')
        const expected = targets.find((t) => t.id === expectedId)
        const name = expected?.item?.label || expected?.caption || 'this one'
        api.setPrompt({ main: `Next comes ${name}.`, sub: `Step ${cursor + 1} of ${order.length}` })
        void api.say(`Next comes ${name}`, { main: `Next comes ${name}.` })
        machine.clock.after(450, () => selector?.unlock(chosen.id))
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const p = pulse(now)
      const responding = machine.phase === 'respond'
      const expectedId = order[cursor]

      // Progress rail: filled pips for steps already placed. This is the child's
      // external memory — essential for a working-memory task not to be a
      // working-memory *test*.
      drawRail(view, order.length, cursor, s)

      for (const t of targets) {
        const demoOn = demoIndex >= 0 && t.item?._order === demoIndex
        const isNext = responding && t.id === expectedId
        drawTarget(view, t, {
          progress: responding ? selector.progressOf(t.id) : 0,
          hover: responding && selector.hovered === t.id,
          highlight: demoOn || (isNext && machine.prompt?.highlightTarget === true),
          pulse: p,
          correct: t.done,
          wrong: t.id === wrongFlashId && now < wrongFlashUntil,
          dim: t.done && responding,
          reducedMotion: s.reducedMotion,
          highContrast: s.highContrast,
        })
        if (t.done && t.stepNumber) drawStepBadge(view, t)
      }

      if (demoIndex >= 0 && !s.reducedMotion) {
        const t = targets.find((x) => x.item?._order === demoIndex)
        if (t) drawDemoHand(view, { x: t.x, y: 0.95 }, { x: t.x, y: t.y + 0.05 }, demoPhase)
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
    },

    unmount() {
      selector?.reset()
      targets = []
      machine = null
    },
  }

  return module
}

function drawRail(view, total, done, s) {
  const ctx = view.ctx
  const r = Math.max(5, view.short * 0.014)
  const gap = r * 2.9
  const w = (total - 1) * gap
  const x0 = view.w / 2 - w / 2
  const y = view.h * 0.875
  ctx.save()
  for (let i = 0; i < total; i++) {
    const x = x0 + i * gap
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = i < done ? PALETTE.green : 'rgba(255,255,255,0.2)'
    ctx.fill()
    if (i === done && !s.reducedMotion) {
      ctx.beginPath()
      ctx.arc(x, y, r * 1.7, 0, Math.PI * 2)
      ctx.strokeStyle = hexA(PALETTE.yellow, 0.8)
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    if (i < total - 1) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + gap - r, y)
      ctx.strokeStyle = i < done - 1 ? hexA(PALETTE.green, 0.7) : 'rgba(255,255,255,0.16)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawStepBadge(view, t) {
  const ctx = view.ctx
  const r = view.pr(t.radius)
  const bx = view.px(t.x) + r * 0.72
  const by = view.py(t.y) - r * 0.72
  const br = Math.max(9, r * 0.3)
  ctx.save()
  ctx.beginPath()
  ctx.arc(bx, by, br, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.green
  ctx.fill()
  ctx.strokeStyle = 'rgba(3,7,18,0.7)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#04140b'
  ctx.font = `800 ${br * 1.25}px Fredoka, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(t.stepNumber), bx, by + 1)
  ctx.restore()
}
