/**
 * TRACE — follow a path with a fingertip.
 *
 * Powers Trace the Road (fine motor control), Air Writing (graphomotor
 * planning), Shape Drawing (motor planning + geometry) and AR Maze (route
 * planning under motor constraint).
 *
 * Three metrics come out, and they fail independently — which is exactly why
 * they are kept apart:
 *   coverage   did they get to the end (persistence, planning)
 *   accuracy   mean deviation from the path (precision)
 *   strays     how often they left it (control)
 *
 * A child can finish a letter with poor accuracy, or trace beautifully but stop
 * half way. One "score" would hide both.
 */
import { OUTCOME } from '../core/telemetry'
import { PathTracer } from '../core/interactions'
import { clamp } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawPath, drawInk, drawHandCursor, drawSkeleton, drawTarget, PALETTE, hexA, roundRect,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import { TrialMachine, pointersFor, handsFor, pulse, Trail } from './base'
import { resolveDifficulty } from '../core/adaptive'
import { glyphStrokes, resample, smooth } from '../content/strokes'

export function traceEngine(game) {
  const cfg = {
    trials: 5,
    /** 'road' | 'glyph' | 'shape' | 'maze' */
    mode: 'road',
    /** For 'glyph': which characters are in play. */
    glyphs: null,
    /** Show the model path while tracing (fades out at higher prompt stages). */
    showGuide: true,
    /** Require a pinch to "put the pen down" (harder; trains grasp). */
    penDown: false,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let tracer = null
  let strokes = [] // model strokes (stage space)
  let strokeIndex = 0
  let ink = [[]] // what the child has drawn
  let penIsDown = false
  let glyphLabel = ''
  let tolerance = 0.08
  let startDot = null
  let endDot = null
  let strokeReports = []
  const trail = new Trail(24)

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: 0.08, windowMs: 0 }, s)
    tolerance = clamp((level.tolerance ?? 0.08) * (s.largeTargets ? 1.4 : 1), 0.035, 0.16)

    const box = fitBox(api.reachBox(level.eccentricity ?? 1))
    let promptText = ''
    let speakText = ''

    if (cfg.mode === 'glyph') {
      const pool = cfg.glyphs || defaultGlyphs()
      const glyph = pool[index % pool.length]
      glyphLabel = glyph
      strokes = glyphStrokes(glyph, box, { spacing: 0.022, smoothing: 1 })
      // Name the character rather than just showing it: "Write l" is ambiguous
      // on screen and meaningless read aloud, and case is invisible to a
      // speech synthesiser.
      const isDigit = /[0-9]/.test(glyph)
      const kind = isDigit ? 'number' : glyph === glyph.toUpperCase() ? 'capital letter' : 'small letter'
      promptText = `Write the ${kind}  ${glyph}`
      speakText = isDigit ? `Write the number ${glyph}` : `Write the ${kind} ${glyph}`
    } else if (cfg.mode === 'shape') {
      const shapes = cfg.shapes || ['circle', 'square', 'triangle', 'diamond', 'star', 'heart', 'zigzag', 'wave', 'spiral']
      const shape = shapes[index % shapes.length]
      glyphLabel = shape
      strokes = glyphStrokes(shape, box, { spacing: 0.022, smoothing: 1 })
      promptText = `Draw a ${shape}`
      speakText = `Draw a ${shape}`
    } else if (cfg.mode === 'maze') {
      strokes = [makeMaze(box, clamp(2 + (level.steps ?? 1), 2, 6), api.rng)]
      glyphLabel = 'maze'
      promptText = 'Follow the path to the end'
      speakText = 'Follow the path all the way to the end'
    } else {
      // 'road': a smooth left-to-right curve; more bends at higher levels.
      const bends = clamp(1 + Math.round((level.steps ?? 1) * 1.2), 1, 5)
      strokes = [makeRoad(box, bends, api.rng)]
      glyphLabel = 'road'
      promptText = 'Drive along the road'
      speakText = 'Follow the road with your finger'
    }

    if (!strokes.length || !strokes[0]?.length) return null

    strokeIndex = 0
    ink = [[]]
    strokeReports = []
    penIsDown = !cfg.penDown
    tracer = new PathTracer(strokes[0], { tolerance, requireOrder: true })
    setDots()

    return {
      targetId: glyphLabel,
      radius: spec.radius,
      windowMs: 0,
      steps: strokes.length,
      promptText,
      speakText,
      tolerance,
    }
  }

  function setDots() {
    const path = strokes[strokeIndex]
    startDot = path?.[0] ? { ...path[0] } : null
    endDot = path?.[path.length - 1] ? { ...path[path.length - 1] } : null
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    api.setPrompt({
      main: trial.promptText,
      sub: cfg.penDown ? 'Pinch your finger and thumb to draw' : 'Start at the green dot',
    })
    void api.say(trial.promptText, { main: trial.promptText, speak: trial.speakText })
    machine.clock.after(1200, () => machine.setPhase('respond'))
  }

  /** Finishes the current stroke and either advances or closes the trial. */
  function completeStroke() {
    const report = tracer.report()
    strokeReports.push(report)
    api.sfx.collect(strokeIndex)
    api.haptic('tap')

    if (strokeIndex < strokes.length - 1) {
      strokeIndex++
      ink.push([])
      tracer = new PathTracer(strokes[strokeIndex], { tolerance, requireOrder: true })
      setDots()
      api.setPrompt({
        main: `Now stroke ${strokeIndex + 1} of ${strokes.length}`,
        sub: 'Start at the green dot',
      })
      void api.say('Next line', { main: `Stroke ${strokeIndex + 1} of ${strokes.length}` })
      return
    }

    // Whole glyph / path done — average the per-stroke reports.
    const avg = (k) => {
      const v = strokeReports.map((r) => r[k]).filter((n) => Number.isFinite(n))
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    const coverage = avg('coverage') ?? 0
    const traceAccuracy = avg('traceAccuracy')
    // "Finished it" is the accuracy question; "how neatly" is a separate,
    // separately-reported thing. Poor neatness never turns into a failure.
    const accuracy =
      coverage >= 0.88 && (traceAccuracy ?? 0) >= 0.45
        ? OUTCOME.CORRECT
        : coverage >= 0.7
          ? OUTCOME.NEAR
          : OUTCOME.INCORRECT

    machine.resolve({
      accuracy,
      chosenId: glyphLabel,
      target: endDot ? { x: endDot.x, y: endDot.y, color: 'green' } : null,
      at: endDot ? { x: endDot.x, y: endDot.y } : null,
      extra: {
        coverage: round(coverage, 3),
        traceAccuracy: round(traceAccuracy, 3),
        meanDeviation: round(avg('meanDeviation'), 4),
        strayCount: strokeReports.reduce((a, r) => a + (r.strayCount || 0), 0),
        pathEfficiency: round(avg('pathEfficiency'), 3),
        offPathMs: strokeReports.reduce((a, r) => a + (r.offPathMs || 0), 0),
      },
    })

    api.setPrompt({
      main:
        accuracy === OUTCOME.CORRECT
          ? 'Beautiful!'
          : accuracy === OUTCOME.NEAR
            ? 'Nearly all the way!'
            : "Let's try that one again.",
      sub: `${Math.round(coverage * 100)}% of the path`,
    })
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
      const p = pointers[0] || null
      trail.push(p)
      machine.reach.step(hands[0] || null, now)

      if (machine.phase !== 'respond' || !tracer) return

      // Pen-down mode: a pinch is the pen. Otherwise the fingertip always draws.
      if (cfg.penDown) {
        const hand = hands[0]
        const down = Boolean(hand?.pinching)
        if (down !== penIsDown) {
          penIsDown = down
          if (down) api.haptic('hover')
        }
      }

      const active = penIsDown ? p : null
      const res = tracer.step(active, { dt, now, stageW, stageH })

      if (active && penIsDown) {
        const strokeInk = ink[strokeIndex] || (ink[strokeIndex] = [])
        const last = strokeInk[strokeInk.length - 1]
        // Only add a point when the hand actually moved, so a resting finger
        // does not pile up thousands of identical samples.
        if (!last || Math.hypot(last.x - active.x, last.y - active.y) > 0.004) {
          strokeInk.push({ x: active.x, y: active.y })
          if (strokeInk.length > 1200) strokeInk.shift()
        }
        if (res.onPath) api.haptic('hover')
      }

      if (res.justFinished) completeStroke()
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !machine.trial) return
      const s = getSettings()
      const pl = pulse(now)
      const stage = machine.prompt || {}
      const responding = machine.phase === 'respond'

      // The model path. At higher prompt stages it thins to a faint hint rather
      // than disappearing entirely — a blank screen is not a fading prompt, it
      // is a different task.
      const guideAlpha = stage.highlightTarget === false ? 0.35 : 1
      view.ctx.save()
      view.ctx.globalAlpha = guideAlpha
      strokes.forEach((stroke, i) => {
        const done = i < strokeIndex
        drawPath(view, stroke, {
          width: tolerance * 2,
          casing: done ? hexA(PALETTE.green, 0.2) : 'rgba(255,255,255,0.22)',
          fill: PALETTE.green,
          visitedIndex: i === strokeIndex && tracer ? tracer.cursor : done ? stroke.length : 0,
        })
      })
      view.ctx.restore()

      // The child's own ink, on top.
      drawInk(view, ink.filter((k) => k.length > 1), {
        color: PALETTE.yellow,
        width: 0.014,
      })

      // Start and end markers: an explicit "begin here" removes a whole class
      // of confusion for a child who cannot infer direction from a line.
      if (responding && startDot && tracer && tracer.coverage < 0.06) {
        drawTarget(
          view,
          { id: 'start', x: startDot.x, y: startDot.y, radius: tolerance * 1.1, color: 'green', sprite: { kind: 'text', value: '●' } },
          { pulse: pl, highlight: true, reducedMotion: s.reducedMotion, highContrast: s.highContrast }
        )
      }
      if (responding && endDot) {
        const ctx = view.ctx
        ctx.save()
        ctx.globalAlpha = 0.85
        ctx.font = `${view.pr(0.055)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🏁', view.px(endDot.x), view.py(endDot.y))
        ctx.restore()
      }

      // Coverage bar — visible persistence feedback.
      if (tracer) drawCoverageBar(view, tracer.coverage, tracer.accuracy)

      if (cfg.penDown) {
        const ctx = view.ctx
        const r = view.short * 0.03
        ctx.save()
        ctx.beginPath()
        ctx.arc(view.w - r * 1.6, view.h - r * 1.6, r, 0, Math.PI * 2)
        ctx.fillStyle = penIsDown ? hexA(PALETTE.green, 0.85) : 'rgba(255,255,255,0.16)'
        ctx.fill()
        ctx.fillStyle = penIsDown ? '#04140b' : 'rgba(255,255,255,0.7)'
        ctx.font = `700 ${r * 0.62}px Fredoka, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(penIsDown ? '✏' : '✋', view.w - r * 1.6, view.h - r * 1.6)
        ctx.restore()
      }

      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.45)' : 'rgba(255,217,61,0.45)',
          })
        }
      }
      for (const h of frame.hands) {
        drawHandCursor(view, h, { trail: h === frame.hands[0] ? trail.points : null, reducedMotion: s.reducedMotion })
      }
    },

    unmount() {
      tracer = null
      strokes = []
      ink = [[]]
      machine = null
    },
  }

  return module
}

const round = (v, dp = 0) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp)

/** Squares off the reach box so a traced circle is a circle, not an ellipse. */
function fitBox(box) {
  const w = box.maxX - box.minX
  const h = box.maxY - box.minY
  const side = Math.min(w, h) * 0.94
  return {
    x: box.minX + (w - side) / 2,
    y: box.minY + (h - side) / 2,
    w: side,
    h: side,
  }
}

function defaultGlyphs() {
  // Letters children write first, then the rest of the alphabet, then digits.
  const first = ['l', 'i', 't', 'o', 'c', 'a', 'd', 'g', 's', 'n', 'm', 'h']
  const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const digits = '0123456789'.split('')
  return [...first, ...caps, ...digits]
}

/** A smooth left-to-right road with `bends` alternating curves. */
function makeRoad(box, bends, rng) {
  const pts = [{ x: box.x, y: box.y + box.h * (0.3 + rng() * 0.4) }]
  for (let i = 1; i <= bends + 1; i++) {
    const t = i / (bends + 1)
    const swing = i % 2 === 0 ? 0.18 : -0.18
    pts.push({
      x: box.x + box.w * t,
      y: clamp(box.y + box.h * (0.5 + swing + (rng() - 0.5) * 0.2), box.y + 0.02, box.y + box.h - 0.02),
    })
  }
  return smooth(resample(pts.map((p) => [p.x, p.y]), 0.02), 3)
}

/**
 * A corridor through a small grid: pick a monotone-ish route from top-left to
 * bottom-right so it is always solvable, then round the corners.
 */
function makeMaze(box, steps, rng) {
  const cols = steps + 1
  const rows = steps + 1
  const cell = { w: box.w / cols, h: box.h / rows }
  let c = 0
  let r = 0
  const pts = [[box.x + cell.w * 0.5, box.y + cell.h * 0.5]]
  while (c < cols - 1 || r < rows - 1) {
    const canRight = c < cols - 1
    const canDown = r < rows - 1
    const goRight = canRight && (!canDown || rng() < 0.5)
    if (goRight) c++
    else r++
    pts.push([box.x + cell.w * (c + 0.5), box.y + cell.h * (r + 0.5)])
  }
  return smooth(resample(pts, 0.018), 2)
}

function drawCoverageBar(view, coverage, accuracy) {
  const ctx = view.ctx
  const w = view.w * 0.4
  const h = Math.max(7, view.short * 0.018)
  const x = view.w / 2 - w / 2
  const y = view.h * 0.955
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  // Colour encodes neatness, length encodes how far they got — two separate
  // things, shown as two separate visual channels.
  ctx.fillStyle =
    accuracy == null || accuracy > 0.6 ? PALETTE.green : accuracy > 0.35 ? PALETTE.yellow : PALETTE.orange
  const fw = Math.max(h, w * clamp(coverage, 0, 1))
  roundRect(ctx, x, y, fw, h, h / 2)
  ctx.fill()
  ctx.restore()
}
