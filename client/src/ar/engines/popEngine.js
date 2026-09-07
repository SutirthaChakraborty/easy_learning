/**
 * POP — a target appears somewhere in the child's reach; get to it.
 *
 * Powers Ball Pop (reaction and orienting) and Whole-Body Number Hunt (the same
 * mechanic across a standing reach envelope, where a target high left really
 * does need a step and a stretch).
 *
 * This engine measures reaching, so it is careful about the two halves of a
 * reach: `latencyMs` is prompt → first intentional movement, `movementTimeMs`
 * is movement → contact. A child who orients instantly but moves slowly, and a
 * child who moves fast but takes a second to notice, produce completely
 * different rows here — and would produce an identical "reaction time" in a
 * naive implementation.
 */
import { OUTCOME } from '../core/telemetry'
import { layoutSlots, clamp, aspectDist, pathEfficiency, pick } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawReachBox, PALETTE, colorOf, hexA,
} from '../core/draw'
import { HAND_BONES, POSE_BONES, POSE } from '../core/vision'
import {
  pointersFor, makeTargets, pulse, Trail, contactError, crossedMidline,
} from './base'
import { resolveDifficulty, recordTrialOutcome, describeStep } from '../core/adaptive'
import { getSets } from '../content'

export function popEngine(game) {
  const cfg = {
    spawns: 16,
    concurrent: 1,
    /** How long a target waits to be touched before it counts as missed. */
    lifetimeMs: 3200,
    /** Gap between one target vanishing and the next appearing. */
    gapMs: 420,
    sets: ['shapes'],
    spriteKind: 'shape',
    /** 'hand' for Ball Pop, 'both' for the whole-body version. */
    tracking: 'hand',
    /** Whole-body mode also accepts a wrist as the pointer and shows the skeleton. */
    wholeBody: false,
    /** Optional: only these items may appear (e.g. digits for the number hunt). */
    filter: null,
    ...(game.config || {}),
  }

  let api = null
  let level = null
  let prompt = null
  let promptStage = 'A'
  let radius = 0.11
  let live = [] // { target, bornAt, expiresAt, reach: {…} }
  let spawned = 0
  let resolved = 0
  let score = 0
  let streak = 0
  let bestStreak = 0
  let nextSpawnAt = 0
  let ended = false
  const trail = new Trail(18)
  const lastPointer = new Map() // side -> {x,y} for velocity when using wrists

  function refreshDifficulty() {
    const d = resolveDifficulty(game)
    level = d.level
    prompt = d.prompt
    promptStage = d.promptStage
    const spec = accommodate(
      { radius: level.targetSize ?? 0.11, windowMs: cfg.lifetimeMs },
      getSettings()
    )
    radius = spec.radius
    return spec
  }

  function spawn(now) {
    const spec = refreshDifficulty()
    const box = api.reachBox(level.eccentricity ?? 1)
    const pool = cfg.filter ? getSets(cfg.sets).filter(cfg.filter) : getSets(cfg.sets)
    if (!pool.length) return

    const existing = live.map((l) => l.target)
    const slot = layoutSlots(1 + existing.length, box, radius, api.rng).find(
      (s) => existing.every((t) => Math.hypot(t.x - s.x, t.y - s.y) > radius * 2.2)
    ) || layoutSlots(1, box, radius, api.rng)[0]

    const item = pick(pool, api.rng)
    const [t] = makeTargets([item], [slot], {
      radius,
      spriteKind: cfg.spriteKind,
      captions: false,
    })
    t.id = `${item.id}-${spawned}`
    t.color = POP_COLORS[spawned % POP_COLORS.length]

    // Response window: the lifetime, stretched by the extra-time accommodation.
    const lifetime = spec.windowMs || cfg.lifetimeMs

    live.push({
      target: t,
      item,
      bornAt: now,
      expiresAt: now + lifetime,
      lifetime,
      movementStartAt: null,
      samples: [],
      peakSpeed: 0,
      handSide: null,
    })
    spawned++
    api.sfx.appear((spawned % 5) * 2)
    api.haptic('hover')
  }

  function resolveOne(entry, outcome, pointer, now, stageW, stageH) {
    live = live.filter((l) => l !== entry)
    resolved++

    const latencyPipeline = api.pipelineLatency()
    const hit = outcome === OUTCOME.CORRECT
    const latencyMs =
      entry.movementStartAt == null
        ? null
        : Math.max(0, Math.round(entry.movementStartAt - entry.bornAt - latencyPipeline))
    const movementTimeMs =
      entry.movementStartAt == null ? null : Math.max(0, Math.round(now - entry.movementStartAt))

    api.recorder.trial({
      accuracy: outcome,
      promptLevel: promptStage,
      prompted: Boolean(prompt?.showAnimatedHand),
      targetId: entry.item.id,
      chosenId: hit ? entry.item.id : null,
      choices: 1,
      latencyMs,
      movementTimeMs,
      totalMs: Math.max(0, Math.round(now - entry.bornAt - latencyPipeline)),
      pathEfficiency: pathEfficiency(entry.samples),
      peakSpeed: Math.round(entry.peakSpeed * 1000) / 1000,
      hand: entry.handSide,
      crossedMidline: pointer ? crossedMidline(lastFrame, pointer, entry.target) : null,
      contactError: hit ? contactError(pointer, entry.target, stageW, stageH) : null,
      targetRadius: entry.target.radius,
      windowMs: entry.lifetime,
      timedOut: !hit,
      pipelineLatencyMs: latencyPipeline,
    })

    if (hit) {
      streak++
      bestStreak = Math.max(bestStreak, streak)
      score += 10 + Math.min(streak - 1, 5) * 2
      api.sfx.pop((streak % 6) * 2)
      api.haptic('correct')
      if (!getSettings().reducedMotion) {
        api.particles.burst(entry.target.x, entry.target.y, colorOf(entry.target.color))
      }
    } else {
      streak = 0
      api.sfx.neutral()
    }

    const fb = recordTrialOutcome(game, {
      accuracy: outcome,
      prompted: false,
      latencyMs,
      timedOut: !hit,
    })
    api.setHud({
      trial: resolved,
      total: cfg.spawns,
      score,
      streak,
      promptStage: fb.promptStage,
      step: describeStep(fb.stepped),
    })
    if (fb.stepped) api.recorder.event('difficultyStep', fb.stepped)

    nextSpawnAt = now + cfg.gapMs
    if (resolved >= cfg.spawns && !live.length) finish()
  }

  function finish() {
    if (ended) return
    ended = true
    api.finish({ outcome: 'completed', bestStreak, score })
  }

  let lastFrame = null

  const module = {
    requires: cfg.wholeBody ? 'both' : 'hand',

    difficultySnapshot() {
      const d = resolveDifficulty(game)
      return { ...d.level, promptStage: d.promptStage }
    },

    mount(a) {
      api = a
      refreshDifficulty()
      api.setHud({ total: cfg.spawns, trial: 0, score: 0, streak: 0, promptStage })
      const line = cfg.wholeBody
        ? 'Reach and touch every one — high, low, left and right!'
        : 'Touch each one as fast as you can!'
      api.setPrompt({ main: line, sub: cfg.wholeBody ? 'Use your whole body' : 'Use either hand' })
      void api.say(line, { main: line })
      nextSpawnAt = api.clock.now() + 900
    },

    update(f) {
      if (ended) return
      lastFrame = f.frame
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      trail.push(pointers[0])

      // ── spawn ──
      if (spawned < cfg.spawns && live.length < cfg.concurrent && now >= nextSpawnAt) {
        spawn(now)
      }

      // ── per-target kinematics and hit test ──
      for (const entry of [...live]) {
        // Track movement onset for THIS target's window.
        for (const p of pointers) {
          const prev = lastPointer.get(p.side)
          const speed = p.hand
            ? p.hand.speed
            : prev && dt > 0
              ? Math.hypot(p.x - prev.x, p.y - prev.y) / dt
              : 0
          if (speed > entry.peakSpeed) entry.peakSpeed = speed
          if (!entry.movementStartAt && speed >= 0.18) {
            entry.movementStartAt = now
            entry.handSide = p.side
          }
          if (entry.movementStartAt) {
            entry.samples.push({ x: p.x, y: p.y })
            if (entry.samples.length > 700) entry.samples.shift()
          }
        }

        let hitPointer = null
        for (const p of pointers) {
          if (aspectDist(p, entry.target, stageW, stageH) <= entry.target.radius * 1.2) {
            hitPointer = p
            break
          }
        }
        if (hitPointer) {
          entry.handSide = hitPointer.side || entry.handSide
          resolveOne(entry, OUTCOME.CORRECT, hitPointer, now, stageW, stageH)
          continue
        }
        if (now >= entry.expiresAt) {
          resolveOne(entry, OUTCOME.OMISSION, null, now, stageW, stageH)
        }
      }

      for (const p of pointers) lastPointer.set(p.side, { x: p.x, y: p.y })
    },

    render(f) {
      const { view, frame, now } = f
      const s = getSettings()
      const p = pulse(now)

      if (s.showMetrics) {
        drawReachBox(view, api.reachBox(level?.eccentricity ?? 1), { label: 'reach' })
      }

      for (const entry of live) {
        // A shrinking rim shows the target's remaining life — a visible, fair
        // clock instead of a target that just disappears.
        const remaining = clamp((entry.expiresAt - now) / entry.lifetime, 0, 1)
        drawLifeRing(view, entry.target, remaining)
        drawTarget(view, entry.target, {
          pulse: p,
          highlight: prompt?.highlightTarget === true || remaining > 0.9,
          reducedMotion: s.reducedMotion,
          highContrast: s.highContrast,
        })
      }

      if (cfg.wholeBody && frame.pose && s.showSkeleton) {
        drawSkeleton(view, frame.pose.lm, POSE_BONES, {
          color: 'rgba(126,232,255,0.45)',
          joints: true,
          lineWidth: Math.max(3, view.short * 0.007),
        })
        // Wrists double as pointers in whole-body mode, so mark them clearly.
        for (const [idx, side] of [[POSE.LEFT_WRIST, 'left'], [POSE.RIGHT_WRIST, 'right']]) {
          const j = frame.pose.lm[idx]
          if (!j || (j.visibility ?? 1) < 0.45) continue
          const ctx = view.ctx
          ctx.save()
          ctx.beginPath()
          ctx.arc(view.px(j.x), view.py(j.y), view.pr(0.022), 0, Math.PI * 2)
          ctx.fillStyle = hexA(side === 'left' ? PALETTE.teal : PALETTE.yellow, 0.75)
          ctx.fill()
          ctx.restore()
        }
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

    onResume() {
      // Give every live target its full window back — being paused is not a miss.
      const now = api.clock.now()
      for (const entry of live) entry.expiresAt = now + entry.lifetime
      nextSpawnAt = Math.max(nextSpawnAt, now + 400)
    },

    unmount() {
      live = []
      ended = true
    },
  }

  return module
}

const POP_COLORS = ['blue', 'green', 'orange', 'pink', 'teal', 'purple', 'yellow']

function drawLifeRing(view, target, remaining) {
  const ctx = view.ctx
  const cx = view.px(target.x)
  const cy = view.py(target.y)
  const r = view.pr(target.radius) * 1.32
  ctx.save()
  ctx.lineWidth = Math.max(3, view.pr(target.radius) * 0.13)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining)
  ctx.strokeStyle =
    remaining > 0.5 ? hexA(PALETTE.teal, 0.9) : remaining > 0.22 ? hexA(PALETTE.yellow, 0.9) : hexA(PALETTE.orange, 0.9)
  ctx.stroke()
  ctx.restore()
}
