/**
 * The interaction primitives. Every game in the catalogue is one of these ten
 * verbs plus content:
 *
 *   Touch · Hold · Grab · Drag · Trace · Avoid · Imitate · Sequence · MoveOnCue · Choose
 *
 * They are plain stateful classes rather than hooks so an engine can own dozens
 * of them and step them all from one animation frame with no React involvement.
 *
 * Two invariants matter clinically:
 *  - selection is *dwell*-based, never a single-frame intersection. A fingertip
 *    that flies over a target on the way somewhere else must not count, and a
 *    tremor near a boundary must not fire repeatedly.
 *  - every primitive records when the movement *started* separately from when
 *    contact happened, so latency (cognitive) and movement time (motor) never
 *    get conflated.
 */
import { aspectDist, clamp, pathEfficiency, angleAt } from './geometry'
import { POSE } from './vision'

/**
 * Dwell-based selection over a set of targets.
 *
 * Each target accumulates progress while a pointer rests inside it and bleeds
 * progress away when the pointer leaves — so a brush-past decays instead of
 * latching. Reaching 1.0 fires `onSelect` once and locks that target until it
 * is reset.
 */
export class DwellSelector {
  /**
   * @param {{dwellMs?: number, releaseFactor?: number, hitScale?: number}} opts
   */
  constructor(opts = {}) {
    this.dwellMs = opts.dwellMs ?? 260
    // Progress decays 1.6× faster than it builds: leaving a target should feel
    // like an explicit "no", but a single dropped tracking frame should not.
    this.releaseFactor = opts.releaseFactor ?? 1.6
    this.hitScale = opts.hitScale ?? 1.15 // forgiving hitbox around the drawn radius
    this.progress = new Map() // targetId -> 0..1
    this.locked = new Set()
    this.hovered = null
    this.hoverSince = null
  }

  reset() {
    this.progress.clear()
    this.locked.clear()
    this.hovered = null
    this.hoverSince = null
  }

  unlock(id) {
    this.locked.delete(id)
    this.progress.set(id, 0)
  }

  progressOf(id) {
    return this.progress.get(id) || 0
  }

  /**
   * @param {Array<{id:string,x:number,y:number,radius:number,disabled?:boolean}>} targets
   * @param {Array<{x:number,y:number,side?:string}>} pointers fingertips, in stage space
   * @param {{dt:number, now:number, stageW:number, stageH:number}} ctx
   * @returns {{selected: object|null, pointer: object|null, hovering: string|null, distance: number|null}}
   */
  step(targets, pointers, ctx) {
    const { dt, now, stageW, stageH } = ctx
    let best = null

    // Which target is each pointer inside? Nearest wins when hitboxes overlap.
    const inside = new Map()
    for (const p of pointers) {
      if (!p) continue
      let nearest = null
      for (const tgt of targets) {
        if (!tgt || tgt.disabled || this.locked.has(tgt.id)) continue
        const d = aspectDist(p, tgt, stageW, stageH)
        const r = (tgt.radius ?? 0.09) * this.hitScale
        if (d <= r && (!nearest || d < nearest.d)) nearest = { tgt, d, pointer: p }
      }
      if (nearest) {
        const prev = inside.get(nearest.tgt.id)
        if (!prev || nearest.d < prev.d) inside.set(nearest.tgt.id, nearest)
      }
    }

    const step = dt * 1000
    for (const tgt of targets) {
      if (!tgt) continue
      const hit = inside.get(tgt.id)
      let p = this.progress.get(tgt.id) || 0
      if (hit && !this.locked.has(tgt.id) && !tgt.disabled) {
        p = clamp(p + step / Math.max(this.dwellMs, 1), 0, 1)
        if (!best || p > best.progress) {
          best = { target: tgt, pointer: hit.pointer, distance: hit.d, progress: p }
        }
      } else {
        p = clamp(p - (step * this.releaseFactor) / Math.max(this.dwellMs, 1), 0, 1)
      }
      this.progress.set(tgt.id, p)
    }

    // Track hover onset — this is the "movement arrived" timestamp.
    const hoverId = best?.target?.id ?? null
    if (hoverId !== this.hovered) {
      this.hovered = hoverId
      this.hoverSince = hoverId ? now : null
    }

    if (best && best.progress >= 1) {
      this.locked.add(best.target.id)
      return {
        selected: best.target,
        pointer: best.pointer,
        hovering: hoverId,
        distance: best.distance,
        hoverSince: this.hoverSince,
      }
    }

    return {
      selected: null,
      pointer: best?.pointer ?? null,
      hovering: hoverId,
      distance: best?.distance ?? null,
      hoverSince: this.hoverSince,
    }
  }
}

/**
 * "Hold still on this target for N ms" — used by Wait for It, Personal Space
 * Bubble and the calm-movement games. Unlike DwellSelector this reports
 * continuous progress and can be broken and restarted.
 */
export class HoldTimer {
  constructor(holdMs = 1500) {
    this.holdMs = holdMs
    this.elapsed = 0
    this.breaks = 0
    this.wasIn = false
    this.completed = false
  }
  reset(holdMs) {
    if (holdMs != null) this.holdMs = holdMs
    this.elapsed = 0
    this.breaks = 0
    this.wasIn = false
    this.completed = false
  }
  /** @returns {{progress:number, justCompleted:boolean, justBroke:boolean}} */
  step(isInside, dt) {
    let justBroke = false
    if (isInside) {
      this.elapsed += dt * 1000
    } else {
      if (this.wasIn && this.elapsed > 120 && !this.completed) {
        this.breaks++
        justBroke = true
      }
      this.elapsed = Math.max(0, this.elapsed - dt * 1000 * 2)
    }
    this.wasIn = isInside
    const progress = clamp(this.elapsed / Math.max(this.holdMs, 1), 0, 1)
    const justCompleted = progress >= 1 && !this.completed
    if (justCompleted) this.completed = true
    return { progress, justCompleted, justBroke }
  }
}

/**
 * Grab + drag: pinch (or closed fist, for children who cannot oppose the thumb)
 * picks an object up, releasing drops it. Used by the sorting / tidying games.
 */
export class GrabController {
  constructor(opts = {}) {
    this.grabRadiusScale = opts.grabRadiusScale ?? 1.3
    this.mode = opts.mode ?? 'pinch' // 'pinch' | 'fist' | 'either'
    this.held = null // { id, offsetX, offsetY, side, grabbedAt, path: [] }
  }

  isClosed(hand) {
    if (!hand) return false
    if (this.mode === 'pinch') return hand.pinching
    if (this.mode === 'fist') return hand.gesture === 'fist'
    return hand.pinching || hand.gesture === 'fist'
  }

  reset() {
    this.held = null
  }

  /**
   * @returns {{grabbed:object|null, dropped:object|null, held:object|null, position:{x,y}|null}}
   */
  step(items, hands, ctx) {
    const { stageW, stageH, now } = ctx

    if (this.held) {
      const hand = hands.find((h) => h?.side === this.held.side) || hands[0]
      if (!hand || !this.isClosed(hand)) {
        const dropped = { ...this.held, releasedAt: now }
        this.held = null
        return { grabbed: null, dropped, held: null, position: dropped.position ?? null }
      }
      const position = {
        x: clamp(hand.palm.x + this.held.offsetX, 0, 1),
        y: clamp(hand.palm.y + this.held.offsetY, 0, 1),
      }
      this.held.position = position
      this.held.path.push(position)
      if (this.held.path.length > 400) this.held.path.shift()
      return { grabbed: null, dropped: null, held: this.held, position }
    }

    for (const hand of hands) {
      if (!this.isClosed(hand)) continue
      let nearest = null
      for (const item of items) {
        if (!item || item.disabled) continue
        const d = aspectDist(hand.palm, item, stageW, stageH)
        const r = (item.radius ?? 0.09) * this.grabRadiusScale
        if (d <= r && (!nearest || d < nearest.d)) nearest = { item, d }
      }
      if (nearest) {
        this.held = {
          id: nearest.item.id,
          item: nearest.item,
          side: hand.side,
          offsetX: nearest.item.x - hand.palm.x,
          offsetY: nearest.item.y - hand.palm.y,
          grabbedAt: now,
          position: { x: nearest.item.x, y: nearest.item.y },
          path: [{ x: nearest.item.x, y: nearest.item.y }],
        }
        return { grabbed: this.held, dropped: null, held: this.held, position: this.held.position }
      }
    }

    return { grabbed: null, dropped: null, held: null, position: null }
  }
}

/**
 * Path tracing (Trace the Road, Air Writing, Shape Drawing, AR Maze).
 *
 * Scores three separate things, because they fail independently:
 *   coverage  — how much of the path was visited (did they finish?)
 *   accuracy  — mean deviation from the path (motor precision)
 *   order     — whether waypoints were hit in sequence (planning)
 */
export class PathTracer {
  /**
   * @param {Array<{x:number,y:number}>} path densely sampled waypoints
   * @param {{tolerance?:number, requireOrder?:boolean}} opts tolerance in short-side units
   */
  constructor(path, opts = {}) {
    this.path = path
    this.tolerance = opts.tolerance ?? 0.07
    this.requireOrder = opts.requireOrder ?? true
    this.reset()
  }

  reset() {
    this.visited = new Array(this.path.length).fill(false)
    this.cursor = 0
    this.samples = []
    this.deviations = []
    this.offPathMs = 0
    this.strayCount = 0
    this.wasOff = false
    this.started = false
    this.startedAt = null
    this.finishedAt = null
  }

  get coverage() {
    const hit = this.visited.reduce((s, v) => s + (v ? 1 : 0), 0)
    return this.path.length ? hit / this.path.length : 0
  }

  get accuracy() {
    if (!this.deviations.length) return null
    const mean = this.deviations.reduce((s, d) => s + d, 0) / this.deviations.length
    return clamp(1 - mean / this.tolerance, 0, 1)
  }

  get meanDeviation() {
    if (!this.deviations.length) return null
    return this.deviations.reduce((s, d) => s + d, 0) / this.deviations.length
  }

  /**
   * @param {{x:number,y:number}|null} p fingertip in stage space (null = lifted)
   */
  step(p, ctx) {
    const { dt, now, stageW, stageH } = ctx
    if (!p) {
      this.wasOff = false
      return { onPath: false, coverage: this.coverage, justFinished: false }
    }

    // Nearest waypoint, and its distance — that is the deviation.
    let nearestIdx = 0
    let nearestD = Infinity
    const searchFrom = this.requireOrder ? Math.max(0, this.cursor - 6) : 0
    const searchTo = this.requireOrder
      ? Math.min(this.path.length, this.cursor + 26)
      : this.path.length
    for (let i = searchFrom; i < searchTo; i++) {
      const d = aspectDist(p, this.path[i], stageW, stageH)
      if (d < nearestD) {
        nearestD = d
        nearestIdx = i
      }
    }

    const onPath = nearestD <= this.tolerance
    if (onPath) {
      if (!this.started) {
        this.started = true
        this.startedAt = now
      }
      this.deviations.push(nearestD)
      if (this.deviations.length > 3000) this.deviations.shift()
      // Mark this waypoint and everything skipped over, so a fast sweep still
      // registers as covered.
      const upto = this.requireOrder ? Math.max(nearestIdx, this.cursor) : nearestIdx
      for (let i = this.requireOrder ? this.cursor : nearestIdx; i <= upto; i++) {
        this.visited[i] = true
      }
      if (this.requireOrder) this.cursor = Math.max(this.cursor, nearestIdx)
      this.wasOff = false
    } else if (this.started) {
      this.offPathMs += dt * 1000
      if (!this.wasOff) {
        this.strayCount++
        this.wasOff = true
      }
    }

    this.samples.push({ x: p.x, y: p.y })
    if (this.samples.length > 4000) this.samples.shift()

    const justFinished =
      !this.finishedAt && this.coverage >= 0.9 && (!this.requireOrder || this.cursor >= this.path.length - 3)
    if (justFinished) this.finishedAt = now

    return { onPath, deviation: nearestD, coverage: this.coverage, justFinished, index: nearestIdx }
  }

  report() {
    return {
      coverage: Math.round(this.coverage * 1000) / 1000,
      traceAccuracy: this.accuracy == null ? null : Math.round(this.accuracy * 1000) / 1000,
      meanDeviation: this.meanDeviation == null ? null : Math.round(this.meanDeviation * 10000) / 10000,
      strayCount: this.strayCount,
      offPathMs: Math.round(this.offPathMs),
      pathEfficiency: pathEfficiency(this.samples),
      durationMs:
        this.startedAt && this.finishedAt ? Math.round(this.finishedAt - this.startedAt) : null,
    }
  }
}

/**
 * Reach kinematics for a single trial: when did the hand start moving, when did
 * it arrive, how direct was the route.
 *
 * This is the object that keeps "knew the answer" apart from "moved slowly" —
 * the distinction the whole analytics model rests on.
 */
export class ReachRecorder {
  /** @param {number} moveThreshold stage-units/sec that counts as intentional movement */
  constructor(moveThreshold = 0.18) {
    this.moveThreshold = moveThreshold
    this.reset()
  }

  reset(stimulusAt = null) {
    this.stimulusAt = stimulusAt
    this.movementStartAt = null
    this.contactAt = null
    this.samples = []
    this.peakSpeed = 0
    this.handSide = null
    this.reversals = 0
    this._lastSign = 0
  }

  /** Call once per frame with the active pointer. */
  step(hand, now) {
    if (!hand) return
    if (!this.handSide) this.handSide = hand.side
    const speed = hand.speed ?? 0
    if (speed > this.peakSpeed) this.peakSpeed = speed
    if (!this.movementStartAt && speed >= this.moveThreshold) this.movementStartAt = now

    if (this.movementStartAt) {
      this.samples.push({ x: hand.tip.x, y: hand.tip.y })
      if (this.samples.length > 900) this.samples.shift()
      // Direction reversals along x are a rough index of movement smoothness.
      const sign = Math.sign(hand.velocity?.x || 0)
      if (sign && this._lastSign && sign !== this._lastSign) this.reversals++
      if (sign) this._lastSign = sign
    }
  }

  /**
   * @param {number} now contact timestamp
   * @param {number} pipelineLatencyMs subtracted so we report the child's
   *   latency, not ours
   */
  finish(now, pipelineLatencyMs = 0) {
    this.contactAt = now
    const corrected = (v) => (v == null ? null : Math.max(0, Math.round(v - pipelineLatencyMs)))
    const latencyMs =
      this.stimulusAt == null
        ? null
        : corrected((this.movementStartAt ?? now) - this.stimulusAt)
    const movementTimeMs =
      this.movementStartAt == null ? null : Math.max(0, Math.round(now - this.movementStartAt))
    const totalMs = this.stimulusAt == null ? null : corrected(now - this.stimulusAt)

    return {
      // Time from the prompt to the first intentional movement — this is the
      // cognitive/decision component.
      latencyMs,
      // Time from movement onset to contact — this is the motor component.
      movementTimeMs,
      totalMs,
      peakSpeed: Math.round(this.peakSpeed * 1000) / 1000,
      pathEfficiency: pathEfficiency(this.samples),
      reversals: this.reversals,
      hand: this.handSide,
      pipelineLatencyMs: Math.round(pipelineLatencyMs),
    }
  }
}

/**
 * Body-posture imitation (Mirror Me, Copy My Gesture, Fast vs Slow).
 * Compares joint *angles*, not positions, so it works regardless of the child's
 * height, distance from the camera or where they stand in the frame.
 */
const POSTURE_JOINTS = [
  ['leftElbow', POSE.LEFT_SHOULDER, POSE.LEFT_ELBOW, POSE.LEFT_WRIST],
  ['rightElbow', POSE.RIGHT_SHOULDER, POSE.RIGHT_ELBOW, POSE.RIGHT_WRIST],
  ['leftShoulder', POSE.LEFT_HIP, POSE.LEFT_SHOULDER, POSE.LEFT_ELBOW],
  ['rightShoulder', POSE.RIGHT_HIP, POSE.RIGHT_SHOULDER, POSE.RIGHT_ELBOW],
]

export function posture(pose) {
  if (!pose?.lm) return null
  const out = {}
  for (const [name, a, b, c] of POSTURE_JOINTS) {
    out[name] = angleAt(pose.lm[a], pose.lm[b], pose.lm[c])
  }
  // Wrist height relative to the shoulder line, normalised by shoulder width —
  // distinguishes "arms up" from "arms out" where elbow angle alone cannot.
  const sw = pose.shoulderWidth || 0.2
  out.leftWristRise = (pose.shoulderMid.y - pose.lm[POSE.LEFT_WRIST].y) / sw
  out.rightWristRise = (pose.shoulderMid.y - pose.lm[POSE.RIGHT_WRIST].y) / sw
  out.leftWristSpread = (pose.lm[POSE.LEFT_WRIST].x - pose.shoulderMid.x) / sw
  out.rightWristSpread = (pose.lm[POSE.RIGHT_WRIST].x - pose.shoulderMid.x) / sw
  return out
}

/**
 * @param {object} target a posture spec: joint name -> {value, tol} or number
 * @returns {{score:number, matched:boolean, perJoint:object}} score 0..1
 */
export function matchPosture(pose, target, opts = {}) {
  const cur = posture(pose)
  if (!cur) return { score: 0, matched: false, perJoint: {} }
  const threshold = opts.threshold ?? 0.72
  const perJoint = {}
  let total = 0
  let n = 0
  for (const [joint, spec] of Object.entries(target)) {
    if (cur[joint] == null) continue
    const want = typeof spec === 'number' ? spec : spec.value
    const tol = typeof spec === 'number' ? (joint.includes('Rise') || joint.includes('Spread') ? 0.55 : 32) : spec.tol
    const err = Math.abs(cur[joint] - want)
    const s = clamp(1 - err / tol, 0, 1)
    perJoint[joint] = { current: Math.round(cur[joint] * 10) / 10, want, score: Math.round(s * 100) / 100 }
    total += s
    n++
  }
  const score = n ? total / n : 0
  return { score, matched: score >= threshold, perJoint }
}

/**
 * Movement magnitude over a sliding window — the Red Light / Green Light
 * "freeze" detector and the calm-movement regulator both read this.
 */
export class MotionMeter {
  constructor(windowMs = 420) {
    this.windowMs = windowMs
    this.samples = []
    this.prev = null
  }
  reset() {
    this.samples = []
    this.prev = null
  }
  /**
   * @param {object} pose tracker pose frame
   * @returns {number} normalised movement magnitude (0 = statue, >1 = big movement)
   */
  step(pose, now) {
    if (!pose?.lm) return this.value()
    const joints = [
      POSE.LEFT_WRIST, POSE.RIGHT_WRIST, POSE.NOSE,
      POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP,
    ]
    if (this.prev) {
      const sw = pose.shoulderWidth || 0.2
      let sum = 0
      for (const j of joints) {
        const a = pose.lm[j]
        const b = this.prev[j]
        if (a && b) sum += Math.hypot(a.x - b.x, a.y - b.y) / sw
      }
      this.samples.push({ t: now, v: sum / joints.length })
    }
    this.prev = pose.lm
    while (this.samples.length && now - this.samples[0].t > this.windowMs) this.samples.shift()
    return this.value()
  }
  value() {
    if (!this.samples.length) return 0
    return (this.samples.reduce((s, x) => s + x.v, 0) / this.samples.length) * 60
  }
}

/**
 * Bilateral coordination: two targets that must be touched *together*.
 * `syncWindowMs` is the tolerance — how far apart the two contacts may be and
 * still count as simultaneous.
 */
export class BilateralGate {
  constructor(syncWindowMs = 550) {
    this.syncWindowMs = syncWindowMs
    this.reset()
  }
  reset() {
    this.contacts = new Map() // targetId -> {t, side}
  }
  /**
   * @returns {{complete:boolean, offsetMs:number|null, held:string[]}}
   */
  step(pairs, hands, ctx) {
    const { stageW, stageH, now } = ctx
    for (const tgt of pairs) {
      const hit = hands.find(
        (h) => h && aspectDist(h.tip, tgt, stageW, stageH) <= (tgt.radius ?? 0.1) * 1.2
      )
      if (hit) {
        if (!this.contacts.has(tgt.id)) this.contacts.set(tgt.id, { t: now, side: hit.side })
      } else {
        const c = this.contacts.get(tgt.id)
        // Forget a stale contact so the child can re-try, but allow the sync
        // window to elapse first.
        if (c && now - c.t > this.syncWindowMs) this.contacts.delete(tgt.id)
      }
    }

    const held = [...this.contacts.keys()]
    if (pairs.every((p) => this.contacts.has(p.id)) && pairs.length > 1) {
      const times = pairs.map((p) => this.contacts.get(p.id).t)
      const offsetMs = Math.round(Math.max(...times) - Math.min(...times))
      const sides = pairs.map((p) => this.contacts.get(p.id).side)
      return {
        complete: offsetMs <= this.syncWindowMs,
        offsetMs,
        sides,
        // Two hands on two targets is the point; one hand hopping is not.
        usedBothHands: new Set(sides).size > 1,
        held,
      }
    }
    return { complete: false, offsetMs: null, held, usedBothHands: false }
  }
}
