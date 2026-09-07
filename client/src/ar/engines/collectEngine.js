/**
 * COLLECT — gather a set of things, or move them where they belong.
 *
 *   Count & Collect     "collect 4 apples" — counting inside a movement task
 *   Grocery Mission     remember 2-5 items from a spoken list and fetch them
 *   Pack My School Bag  choose what is needed, leave what is not
 *   Money Shop          pick coins that add up to a price
 *   Sort the Groceries  drag each item into fridge / freezer / cupboard
 *   Laundry Sort        lights and darks
 *   Tidy the Room       put things back where they live
 *
 * Two interaction styles, chosen by `mode`:
 *   'touch'  tap to collect into a basket (lower motor demand)
 *   'drag'   pinch to pick up, move, release into a bin (grasp and release,
 *            the same motor pattern as putting real shopping away)
 *
 * Working memory is trained in a *functional* context here rather than as a
 * digit-span drill: "get your bag, bottle and shoes" is the same load as
 * "remember 3-7-2" but it rehearses something the child actually has to do.
 */
import { OUTCOME } from '../core/telemetry'
import { DwellSelector, GrabController } from '../core/interactions'
import { layoutSlots, layoutRow, clamp, pick, sample, shuffle, fitRadius } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawZone, colorOf, roundRect,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail, contactError, spriteFor,
} from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSets, getSet, spokenName } from '../content'
import { BINS } from '../content/packs'

export function collectEngine(game) {
  const cfg = {
    trials: 5,
    /** 'count' | 'list' | 'need' | 'money' | 'sort' */
    task: 'count',
    /** 'touch' | 'drag' */
    mode: 'touch',
    sets: ['food'],
    /** For 'sort': which attr decides the bin. */
    sortAttr: 'store',
    /** For 'need': the category that is needed. */
    needCat: 'school',
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let selector = null
  let grabber = null
  let items = [] // on-screen collectables
  let bins = []
  let wanted = [] // ids still to collect (or count remaining)
  let collected = []
  let wantCount = 0
  let wantItemId = null
  let priceCents = 0
  let paidCents = 0
  let listNames = []
  let mistakes = 0
  let stepTimes = []
  let lastPickAt = 0
  const trail = new Trail(16)
  let heldGhost = null

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: level.targetSize ?? 0.095, windowMs: 0 }, s)
    const box = api.reachBox(level.eccentricity ?? 1)
    const pool = getSets(cfg.sets)
    if (!pool.length) return null

    collected = []
    wanted = []
    bins = []
    mistakes = 0
    stepTimes = []
    lastPickAt = 0
    paidCents = 0
    heldGhost = null

    let promptText = ''
    let speakText = ''
    let onScreen = []
    let reveal = null
    let span = clamp((level.memorySpan ?? 2) + 1, 2, 5)

    if (cfg.task === 'count') {
      // "Collect 4 apples": one item type, several of it, plus other things.
      const kind = pick(pool, api.rng)
      wantCount = clamp(2 + Math.floor(api.rng() * span), 2, 6)
      wantItemId = kind.id
      const copies = Array.from({ length: wantCount + 1 + Math.floor(api.rng() * 2) }, (_, i) => ({
        ...kind,
        id: `${kind.id}-${i}`,
        _wanted: true,
      }))
      const others = sample(
        pool.filter((p) => p.id !== kind.id),
        clamp((level.choices ?? 3) + 1, 2, 6),
        api.rng
      ).map((it, i) => ({ ...it, id: `${it.id}-x${i}`, _wanted: false }))
      onScreen = shuffle([...copies, ...others], api.rng)
      promptText = `Collect ${wantCount} ${plural(kind.label)}`
      speakText = `Collect ${wantCount} ${plural(spokenName(kind))}`
      listNames = [`${wantCount} × ${kind.label}`]
    } else if (cfg.task === 'list') {
      // A shopping list held in memory: the list is spoken, then hidden.
      const targetItems = sample(pool, span, api.rng)
      wanted = targetItems.map((t) => t.id)
      wantCount = targetItems.length
      const distractors = sample(
        pool.filter((p) => !wanted.includes(p.id)),
        clamp(span + (level.choices ?? 3), 3, 8),
        api.rng
      )
      onScreen = shuffle([...targetItems, ...distractors], api.rng)
      listNames = targetItems.map((t) => t.label)
      reveal = { items: targetItems }
      promptText = `Get: ${listNames.join(', ')}`
      speakText = `Get ${listNames.join(', ')}`
    } else if (cfg.task === 'need') {
      // Pack the bag: everything in the needed category, nothing else.
      const needed = getSets(cfg.sets).filter((i) => (i.cats || []).includes(cfg.needCat))
      const notNeeded = getSets(cfg.sets).filter((i) => !(i.cats || []).includes(cfg.needCat))
      if (!needed.length || !notNeeded.length) return null
      const pickN = clamp(span, 2, 4)
      const targetItems = sample(needed, pickN, api.rng)
      wanted = targetItems.map((t) => t.id)
      wantCount = targetItems.length
      onScreen = shuffle([...targetItems, ...sample(notNeeded, clamp(pickN + 1, 2, 5), api.rng)], api.rng)
      listNames = targetItems.map((t) => t.label)
      promptText = cfg.needPrompt || `Pack what you need for ${cfg.needCat}`
      speakText = promptText
    } else if (cfg.task === 'money') {
      // Pay a price with coins. Solvable by construction: the exact set is on
      // screen, so this is arithmetic, not luck.
      const coins = getSet('money').filter((c) => c.attrs?.value)
      const goods = getSets(['food', 'school'])
      const thing = pick(goods, api.rng)
      const plan = buildPayment(coins, clamp(span, 2, 4), api.rng)
      if (!plan) return null
      priceCents = plan.total
      wanted = plan.coins.map((c, i) => `${c.id}-${i}`)
      wantCount = plan.coins.length
      const shownCoins = plan.coins.map((c, i) => ({ ...c, id: `${c.id}-${i}` }))
      const extraCoins = sample(coins, clamp((level.choices ?? 3), 2, 5), api.rng).map((c, i) => ({
        ...c,
        id: `${c.id}-e${i}`,
      }))
      onScreen = shuffle([...shownCoins, ...extraCoins], api.rng)
      listNames = [fmtMoney(priceCents)]
      reveal = { items: [{ ...thing, caption: fmtMoney(priceCents) }] }
      promptText = `Pay ${fmtMoney(priceCents)} for the ${thing.label.toLowerCase()}`
      speakText = `Pay ${sayMoney(priceCents)} for the ${spokenName(thing)}`
    } else {
      // 'sort': bins along the bottom, items to move into them.
      const binDefs = BINS[cfg.sortAttr] || []
      if (binDefs.length < 2) return null
      const sortable = pool.filter((i) => binDefs.some((b) => b.value === i.attrs?.[cfg.sortAttr]))
      if (!sortable.length) return null
      const chosen = sample(sortable, clamp(span + 1, 2, 5), api.rng)
      wanted = chosen.map((c) => c.id)
      wantCount = chosen.length
      onScreen = chosen

      // Only put out the bins these items actually need, plus at most one
      // decoy, capped by the difficulty's choice count. Five destinations for
      // two objects is clutter, not difficulty — and it makes the correct
      // answer harder to *find* rather than harder to *know*.
      const needed = new Set(chosen.map((c) => c.attrs[cfg.sortAttr]))
      const used = binDefs.filter((b) => needed.has(b.value))
      const spare = binDefs.filter((b) => !needed.has(b.value))
      const room = clamp((level.choices ?? 3) - used.length, 0, spare.length)
      const shown = [...used, ...sample(spare, Math.min(room, used.length < 2 ? 1 : room), api.rng)]
      // A single bin is not a sort, so always offer at least two.
      while (shown.length < 2 && spare.length) shown.push(spare.pop())
      const ordered = binDefs.filter((b) => shown.includes(b))

      const binSlots = layoutRow(ordered.length, { minX: 0.1, maxX: 0.9, minY: 0.8, maxY: 0.9 }, 0.5)
      const binW = Math.min(0.3, 0.9 / ordered.length)
      bins = ordered.map((b, i) => ({
        ...b,
        shape: 'rect',
        x: binSlots[i].x,
        y: 0.85,
        w: binW,
        h: 0.2,
        label: b.label,
        emoji: b.emoji,
      }))
      listNames = ordered.map((b) => b.label)
      promptText = cfg.sortPrompt || 'Put each one where it belongs'
      speakText = promptText
    }

    if (!onScreen.length) return null

    // Items live in the upper part of the frame when there are bins below.
    const itemBox = bins.length
      ? { minX: box.minX, maxX: box.maxX, minY: box.minY, maxY: Math.min(box.maxY, 0.66) }
      : box
    const radius = fitRadius(onScreen.length, spec.radius, itemBox)
    const slots = layoutSlots(onScreen.length, itemBox, radius, api.rng)
    items = makeTargets(onScreen, slots, {
      radius,
      spriteKind: cfg.task === 'money' ? 'text' : 'emoji',
      captions: cfg.task !== 'count',
    })

    // Remember where each item started. A drag that ends anywhere invalid puts
    // the item back here, so nothing can be stranded off-screen or buried under
    // a bin where the child can no longer reach it.
    for (const t of items) t.home = { x: t.x, y: t.y }

    selector = new DwellSelector({ dwellMs: spec.dwellMs })
    grabber = cfg.mode === 'drag' ? new GrabController({ mode: 'either' }) : null

    return {
      targetId: cfg.task === 'count' ? wantItemId : wanted.join('+'),
      radius,
      windowMs: 0,
      memorySpan: cfg.task === 'list' || cfg.task === 'need' ? wantCount : null,
      choiceCount: items.length,
      steps: wantCount,
      promptText,
      speakText,
      answerLabel: listNames.join(', '),
      hasReveal: Boolean(reveal),
      reveal,
      showMs: clamp(1400 + wantCount * 700, 1600, 6000) * (s.extraTimeX || 1),
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    if (trial.hasReveal) {
      // The list is shown AND spoken, then taken away — that removal is the
      // working-memory demand.
      api.setPrompt({ main: trial.promptText, sub: 'Remember them…' })
      void api.say(trial.speakText, { main: trial.promptText, sub: 'Remember them…' })
      machine.clock.after(trial.showMs, () => {
        api.sfx.whoosh()
        api.setPrompt({ main: hideList(trial), sub: `${wantCount} to find` })
        machine.clock.after(500, () => machine.setPhase('respond'))
      })
      return
    }
    api.setPrompt({ main: trial.promptText, sub: '' })
    void api.say(trial.speakText, { main: trial.promptText })
    machine.clock.after(1000, () => machine.setPhase('respond'))
  }

  /** After the reveal the list is deliberately not re-shown. */
  function hideList(trial) {
    if (cfg.task === 'money') return `Pay ${fmtMoney(priceCents)}`
    if (cfg.task === 'list') return 'What was on the list?'
    return trial.promptText
  }

  function finishTrial(kind) {
    const clean = mistakes === 0
    const target = items.find((i) => i.collected) || items[0]
    machine.resolve({
      accuracy: clean ? OUTCOME.CORRECT : OUTCOME.INCORRECT,
      feedbackAs: clean ? OUTCOME.CORRECT : OUTCOME.NEAR,
      chosenId: collected.join('+'),
      target,
      at: target ? { x: target.x, y: target.y } : null,
      note: clean ? null : `${mistakes} wrong pick${mistakes === 1 ? '' : 's'}`,
      extra: {
        collected: collected.length,
        requested: wantCount,
        wrongPicks: mistakes,
        stepLatenciesMs: stepTimes.join(','),
        paidCents: cfg.task === 'money' ? paidCents : null,
        priceCents: cfg.task === 'money' ? priceCents : null,
      },
    })
    api.setPrompt({
      main: clean ? 'All done!' : 'You got them all!',
      sub: kind === 'money' ? `${fmtMoney(paidCents)} paid` : `${collected.length} of ${wantCount}`,
    })
  }

  /** One correct pick. */
  function accept(item, now, at) {
    collected.push(item.id)
    stepTimes.push(Math.round(now - (lastPickAt || machine.phaseStartedAt)))
    lastPickAt = now
    item.collected = true
    item.disabled = true
    api.sfx.collect(collected.length)
    api.haptic('tap')
    if (!getSettings().reducedMotion && at) api.particles.burst(at.x, at.y, colorOf(item.color))

    if (cfg.task === 'money') {
      paidCents += item.item.attrs?.value || 0
      if (paidCents >= priceCents) {
        // Overpaying is a real-world outcome, not a failure — record it and say so.
        const exact = paidCents === priceCents
        if (!exact) mistakes++
        finishTrial('money')
        return
      }
      api.setPrompt({ main: `Pay ${fmtMoney(priceCents)}`, sub: `${fmtMoney(paidCents)} so far` })
      return
    }

    const need = cfg.task === 'count' ? wantCount : wanted.length
    if (collected.length >= need) {
      finishTrial(cfg.task)
      return
    }
    api.setPrompt({
      main: machine.trial.promptText,
      sub: `${collected.length} of ${need}`,
    })
  }

  /** One incorrect pick — neutral, reversible, and counted. */
  function reject(item) {
    mistakes++
    api.sfx.neutral()
    api.haptic('neutral')
    api.setPrompt({
      main: cfg.task === 'count' ? `Only the ${plural(labelOf(wantItemId))}!` : 'Not that one.',
      sub: machine.trial.promptText,
    })
    machine.clock.after(450, () => selector?.unlock(item.id))
  }

  /** Puts a dragged item back where it started. */
  function sendHome(item) {
    if (!item?.home) return
    item.x = item.home.x
    item.y = item.home.y
  }

  function labelOf(id) {
    const base = String(id).split('-')[0]
    const found = items.find((i) => i.item.id.startsWith(base))
    return found?.item.label || 'right ones'
  }

  function isWanted(item) {
    if (cfg.task === 'count') return item.item._wanted === true
    if (cfg.task === 'money') return true // any coin may be offered; the sum decides
    return wanted.includes(item.id) || wanted.includes(item.item.id)
  }

  const module = {
    requires: 'hand',

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
        feedbackMs: 1400,
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

      // ── drag mode: pinch, move, release into a bin ──
      if (grabber) {
        const live = items.filter((i) => !i.collected)
        const res = grabber.step(live, hands, { stageW, stageH, now })
        heldGhost = res.held || null
        if (res.grabbed) {
          api.sfx.pop(2)
          api.haptic('hover')
        }
        if (res.dropped) {
          const item = items.find((i) => i.id === res.dropped.id)
          const pos = res.dropped.position || { x: item.x, y: item.y }
          const bin = bins.find(
            (b) =>
              Math.abs(pos.x - b.x) <= b.w / 2 + 0.02 && Math.abs(pos.y - b.y) <= b.h / 2 + 0.02
          )
          const rightBin = bin && bin.value === item.item.attrs?.[cfg.sortAttr]
          if (rightBin) {
            accept(item, now, pos)
          } else if (!bin) {
            // Let go in mid-air. Send it home: leaving it where it fell can bury
            // it under a bin, out of both sight and reach, and the round could
            // then never be finished.
            sendHome(item)
            api.sfx.neutral()
          } else {
            sendHome(item)
            mistakes++
            api.sfx.neutral()
            api.haptic('neutral')
            api.setPrompt({
              main: `The ${item.item.label.toLowerCase()} does not go in the ${bin.label.toLowerCase()}.`,
              sub: machine.trial.promptText,
            })
            void api.say('Not that one. Try another place.', { main: 'Try another place' })
          }
          heldGhost = null
        }
        // Move the held item's drawn position with the hand.
        if (res.held) {
          const item = items.find((i) => i.id === res.held.id)
          if (item && res.position) {
            item.x = clamp(res.position.x, 0.05, 0.95)
            item.y = clamp(res.position.y, 0.06, 0.94)
          }
        }
        return
      }

      // ── touch mode ──
      const live = items.filter((i) => !i.collected)
      const res = selector.step(live, pointers, { dt, now, stageW, stageH })
      if (!res.selected) return
      const item = res.selected
      const at = { x: item.x, y: item.y }
      void contactError(res.pointer, item, stageW, stageH)
      if (isWanted(item)) accept(item, now, at)
      else reject(item)
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const p = pulse(now)
      const responding = machine.phase === 'respond'
      const trial = machine.trial

      // Reveal phase: the list, big and central.
      if (machine.phase === 'prompt' && trial.hasReveal && machine.phaseElapsed < trial.showMs) {
        const list = trial.reveal.items
        const slots = layoutRow(list.length, { minX: 0.16, maxX: 0.84, minY: 0.4, maxY: 0.5 }, 0.5)
        list.forEach((item, i) => {
          drawTarget(
            view,
            {
              id: `rv-${i}`,
              x: slots[i].x,
              y: slots[i].y,
              radius: trial.radius * 1.3,
              color: ['blue', 'green', 'orange', 'purple', 'pink'][i % 5],
              sprite: spriteFor(item, cfg.task === 'money' ? 'text' : 'emoji'),
              caption: item.caption || item.label,
            },
            { pulse: p, highlight: true, reducedMotion: s.reducedMotion, highContrast: s.highContrast }
          )
        })
        return
      }

      for (const b of bins) {
        const hovering =
          heldGhost &&
          Math.abs(heldGhost.position.x - b.x) <= b.w / 2 + 0.02 &&
          Math.abs(heldGhost.position.y - b.y) <= b.h / 2 + 0.02
        drawZone(view, b, { active: hovering, highContrast: s.highContrast })
      }

      for (const t of items) {
        if (t.collected && !bins.length) continue // collected items leave the field
        drawTarget(view, t, {
          progress: responding && !grabber ? selector.progressOf(t.id) : 0,
          hover: (!grabber && selector.hovered === t.id) || heldGhost?.id === t.id,
          highlight:
            machine.prompt?.highlightTarget === true && isWanted(t) && !t.collected,
          pulse: p,
          correct: t.collected,
          dim: t.collected,
          ghost: heldGhost?.id === t.id,
          reducedMotion: s.reducedMotion,
          highContrast: s.highContrast,
        })
      }

      // Basket / running total — the child's external record of progress.
      drawBasket(view, {
        task: cfg.task,
        collected: collected.length,
        need: cfg.task === 'money' ? null : wantCount,
        paid: paidCents,
        price: priceCents,
      })

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
      grabber?.reset()
      items = []
      bins = []
      machine = null
    },
  }

  return module
}

/** Builds a payment that IS achievable from the coins on screen. */
function buildPayment(coins, howMany, rng) {
  const usable = coins.filter((c) => (c.attrs?.value ?? 0) > 0 && c.attrs.value <= 200)
  if (usable.length < 2) return null
  const picked = []
  let total = 0
  for (let i = 0; i < howMany; i++) {
    const c = pick(usable, rng)
    picked.push(c)
    total += c.attrs.value
  }
  return { coins: picked, total }
}

const fmtMoney = (cents) =>
  cents >= 100 ? `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}` : `${cents}c`
const sayMoney = (cents) =>
  cents >= 100
    ? `${(cents / 100).toFixed(cents % 100 ? 2 : 0)} euro`
    : `${cents} cent${cents === 1 ? '' : 's'}`

function plural(label) {
  const l = String(label).toLowerCase()
  if (/(s|x|ch|sh)$/.test(l)) return `${l}es`
  if (/y$/.test(l)) return `${l.slice(0, -1)}ies`
  return `${l}s`
}

function drawBasket(view, { task, collected, need, paid, price }) {
  const ctx = view.ctx
  const fs = Math.max(12, view.short * 0.032)
  const text =
    task === 'money' ? `${fmtMoney(paid)} / ${fmtMoney(price)}` : `${collected} / ${need}`
  ctx.save()
  // Measure with the font we will actually draw in, or the pill is the wrong size.
  ctx.font = `800 ${fs}px Fredoka, system-ui, sans-serif`
  const w = ctx.measureText(text).width + fs * 3.4
  const x = view.w - w - view.short * 0.03
  const y = view.h * 0.06
  ctx.fillStyle = 'rgba(6,12,28,0.72)'
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  roundRect(ctx, x, y, w, fs * 2.1, fs)
  ctx.fill()
  ctx.stroke()
  ctx.font = `${fs * 1.1}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(task === 'money' ? '💰' : '🧺', x + fs * 0.6, y + fs * 1.05)
  ctx.font = `800 ${fs}px Fredoka, system-ui, sans-serif`
  ctx.fillStyle = '#fff'
  ctx.fillText(text, x + fs * 2.1, y + fs * 1.05)
  ctx.restore()
}
