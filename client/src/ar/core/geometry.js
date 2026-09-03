/**
 * Coordinate spaces used across the AR games — get these right once and every
 * game inherits correct hit-testing.
 *
 *   VIDEO space   normalized [0,1] as MediaPipe reports it, origin top-left of
 *                 the camera frame, x growing to the camera's right.
 *   STAGE space   normalized [0,1] over the visible play area, origin top-left,
 *                 x growing to the *child's* right (i.e. mirrored, selfie view).
 *                 Every target position and every hit test lives here.
 *   PIXEL space   stage space × stage size, for canvas drawing.
 *
 * The video is rendered with `object-fit: cover`, so part of the frame is
 * cropped. `makeStageTransform` builds the exact same crop MediaPipe never sees,
 * which is why a fingertip drawn at the child's fingertip actually lands on the
 * target they are reaching for.
 */

export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a, b, t) => a + (b - a) * t

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * @param {number} videoW intrinsic video width
 * @param {number} videoH intrinsic video height
 * @param {number} stageW visible stage width in CSS px
 * @param {number} stageH visible stage height in CSS px
 * @param {boolean} mirror true when the video is CSS-flipped (selfie view)
 */
export function makeStageTransform(videoW, videoH, stageW, stageH, mirror = true) {
  if (!videoW || !videoH || !stageW || !stageH) {
    // Degenerate: identity, so the game is still interactive while the camera warms up.
    return {
      toStage: (x, y) => ({ x: mirror ? 1 - x : x, y }),
      toVideo: (x, y) => ({ x: mirror ? 1 - x : x, y }),
      scale: 1,
      cropX: 0,
      cropY: 0,
    }
  }

  // `cover`: scale so the video fully covers the stage, then centre-crop.
  const scale = Math.max(stageW / videoW, stageH / videoH)
  const drawnW = videoW * scale
  const drawnH = videoH * scale
  const cropX = (drawnW - stageW) / 2
  const cropY = (drawnH - stageH) / 2

  const toStage = (x, y) => {
    const mx = mirror ? 1 - x : x
    return {
      x: (mx * drawnW - cropX) / stageW,
      y: (y * drawnH - cropY) / stageH,
    }
  }

  const toVideo = (u, v) => {
    const px = (u * stageW + cropX) / drawnW
    return { x: mirror ? 1 - px : px, y: (v * stageH + cropY) / drawnH }
  }

  return { toStage, toVideo, scale, cropX, cropY, drawnW, drawnH }
}

/**
 * Stage space is normalized per-axis, so a circle of radius r looks like an
 * ellipse unless we correct for aspect. All radii in game configs are expressed
 * as a fraction of the stage's *shorter* side; this converts a stage-space
 * delta into an aspect-correct distance.
 */
export function aspectDist(a, b, stageW, stageH) {
  const short = Math.min(stageW, stageH) || 1
  const dx = ((a.x - b.x) * stageW) / short
  const dy = ((a.y - b.y) * stageH) / short
  return Math.hypot(dx, dy)
}

/** Angle at vertex b, formed by a-b-c, in degrees (0-180). */
export function angleAt(a, b, c) {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const n1 = Math.hypot(v1x, v1y)
  const n2 = Math.hypot(v2x, v2y)
  if (!n1 || !n2) return 0
  const cos = clamp((v1x * v2x + v1y * v2y) / (n1 * n2), -1, 1)
  return (Math.acos(cos) * 180) / Math.PI
}

/**
 * Straight-line distance ÷ actual travelled path. 1.0 = a perfectly direct
 * reach; 0.4 = a very roundabout one. Clinically this is the movement-quality
 * number, kept separate from "did they pick the right answer".
 */
export function pathEfficiency(points) {
  if (!points || points.length < 2) return null
  let travelled = 0
  for (let i = 1; i < points.length; i++) travelled += dist(points[i - 1], points[i])
  if (travelled < 1e-6) return null
  const straight = dist(points[0], points[points.length - 1])
  return clamp(straight / travelled, 0, 1)
}

/** Median of a numeric array (returns null for empty). */
export function median(values) {
  const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!v.length) return null
  const m = v.length >> 1
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

/** Population standard deviation (returns null for < 2 samples). */
export function stdev(values) {
  const v = values.filter(Number.isFinite)
  if (v.length < 2) return null
  const mean = v.reduce((s, n) => s + n, 0) / v.length
  return Math.sqrt(v.reduce((s, n) => s + (n - mean) ** 2, 0) / v.length)
}

/** Interquartile range — robust spread, useful with the small n of one session. */
export function iqr(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (v.length < 4) return null
  const q = (p) => {
    const idx = (v.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    return lo === hi ? v[lo] : lerp(v[lo], v[hi], idx - lo)
  }
  return q(0.75) - q(0.25)
}

/**
 * Deterministic PRNG (mulberry32). Games seed from the trial index so a replay
 * of the same session lays targets out identically — needed to compare a
 * child's two attempts at the same trial.
 */
export function makeRng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates using a supplied rng, non-mutating. */
export function shuffle(arr, rng = Math.random) {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)]
}

/** `n` distinct items from `arr` (or as many as exist). */
export function sample(arr, n, rng = Math.random) {
  return shuffle(arr, rng).slice(0, Math.min(n, arr.length))
}

/**
 * Lays out up to `n` non-overlapping slots inside a reach box, biased towards
 * a ring at `spread` so targets are reachable but not stacked. Positions are in
 * stage space.
 *
 * @param {{minX:number,maxX:number,minY:number,maxY:number}} box reach envelope
 */
export function layoutSlots(n, box, radius, rng = Math.random, opts = {}) {
  const { attempts = 300, minGapFactor = 2.2, outer } = opts
  // Overlapping targets are not a cosmetic problem: two bubbles that touch make
  // the child's selection ambiguous and the recorded answer unreliable. So the
  // box is *grown* towards the screen edge until n targets genuinely fit,
  // rather than the spacing being relaxed until they collide.
  const limit = outer || { minX: 0.05, maxX: 0.95, minY: 0.07, maxY: 0.93 }
  const spacing = radius * minGapFactor
  const fitted = growToFit(n, box, radius, spacing, limit)

  const pad = radius * 1.02
  const minX = clamp(fitted.minX + pad, 0.02, 0.98)
  const maxX = clamp(fitted.maxX - pad, 0.02, 0.98)
  const minY = clamp(fitted.minY + pad, 0.02, 0.98)
  const maxY = clamp(fitted.maxY - pad, 0.02, 0.98)
  const w = Math.max(maxX - minX, 0.001)
  const h = Math.max(maxY - minY, 0.001)

  const out = []
  let gap = spacing
  for (let tries = 0; out.length < n && tries < attempts; tries++) {
    const p = { x: minX + rng() * w, y: minY + rng() * h }
    if (out.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= gap)) out.push(p)
    // Rejection sampling can get unlucky even in a box that fits; ease off
    // slightly, but never below touching distance.
    if (tries > 0 && tries % 75 === 0) gap = Math.max(gap * 0.92, radius * 2.02)
  }

  // Deterministic fallback: an even grid, which is guaranteed collision-free
  // because `growToFit` sized the box for exactly this grid.
  if (out.length < n) {
    const { cols, rows } = gridFor(n, w, h)
    out.length = 0
    for (let i = 0; i < n; i++) {
      const c = i % cols
      const r = Math.floor(i / cols)
      out.push({
        x: cols === 1 ? minX + w / 2 : minX + (w * c) / (cols - 1),
        y: rows === 1 ? minY + h / 2 : minY + (h * r) / (rows - 1),
      })
    }
  }

  return out.slice(0, n)
}

/**
 * The largest radius at which `n` targets still fit side by side without
 * touching, given the play area they may grow into.
 *
 * This exists because "big targets" and "six choices" are two independent
 * difficulty dimensions that the adaptive engine can raise separately, and the
 * combination is physically impossible. Overlapping bubbles would make the
 * child's selection ambiguous and the recorded answer meaningless, so the
 * radius yields. The child still gets the biggest target the screen allows.
 *
 * @param {number} n how many targets
 * @param {number} radius the requested radius (short-side fraction)
 * @param {{minX,maxX,minY,maxY}} [limit] the outer play area
 */
export function fitRadius(n, radius, limit) {
  if (n <= 1) return radius
  const lim = limit || { minX: 0.05, maxX: 0.95, minY: 0.07, maxY: 0.93 }
  const W = lim.maxX - lim.minX
  const H = lim.maxY - lim.minY
  const { cols, rows } = gridFor(n, W, H)
  // Centre-to-centre spacing must be ≥ 2.2r, and the outermost centres sit one
  // radius inside the edge: (cols-1)*2.2r + 2.04r ≤ W.
  const maxByW = W / ((cols - 1) * 2.2 + 2.04)
  const maxByH = H / ((rows - 1) * 2.2 + 2.04)
  return Math.max(0.045, Math.min(radius, maxByW, maxByH))
}

/** Column/row split that best matches the box's aspect. */
function gridFor(n, w, h) {
  let best = null
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    // Prefer the arrangement whose cell aspect is closest to square.
    const cellW = w / cols
    const cellH = h / rows
    const score = Math.abs(Math.log((cellW || 1e-6) / (cellH || 1e-6)))
    if (!best || score < best.score) best = { cols, rows, score }
  }
  return best
}

/**
 * Expands `box` symmetrically about its centre until an even grid of `n` circles
 * of `radius` fits with `spacing` between centres, stopping at `limit`.
 */
function growToFit(n, box, radius, spacing, limit) {
  let b = { ...box }
  for (let i = 0; i < 40; i++) {
    const w = b.maxX - b.minX - radius * 2.04
    const h = b.maxY - b.minY - radius * 2.04
    const { cols, rows } = gridFor(n, Math.max(w, 1e-6), Math.max(h, 1e-6))
    const needW = (cols - 1) * spacing
    const needH = (rows - 1) * spacing
    if (w >= needW && h >= needH) return b
    const atLimit =
      b.minX <= limit.minX + 1e-6 && b.maxX >= limit.maxX - 1e-6 &&
      b.minY <= limit.minY + 1e-6 && b.maxY >= limit.maxY - 1e-6
    if (atLimit) return b
    const cx = (b.minX + b.maxX) / 2
    const cy = (b.minY + b.maxY) / 2
    const gx = Math.max((b.maxX - b.minX) * 0.06, 0.015)
    const gy = Math.max((b.maxY - b.minY) * 0.06, 0.015)
    b = {
      minX: Math.max(limit.minX, cx - (cx - b.minX) - gx),
      maxX: Math.min(limit.maxX, cx + (b.maxX - cx) + gx),
      minY: Math.max(limit.minY, cy - (cy - b.minY) - gy),
      maxY: Math.min(limit.maxY, cy + (b.maxY - cy) + gy),
    }
  }
  return b
}

/**
 * Evenly spaced positions along a horizontal band — used whenever the layout
 * should be predictable (sequencing, word building, sorting bins), because a
 * child learning an order should not also have to re-scan a random field.
 */
export function layoutRow(n, box, y = 0.5, opts = {}) {
  const { inset = 0.08, radius = 0, outer } = opts
  const lim = outer || { minX: 0.05, maxX: 0.95 }
  let minX = clamp(box.minX + inset, 0.04, 0.96)
  let maxX = clamp(box.maxX - inset, 0.04, 0.96)
  const cy = clamp(lerp(box.minY, box.maxY, y), 0.1, 0.9)
  if (n === 1) return [{ x: (minX + maxX) / 2, y: cy }]

  // Widen the row until the tiles stop touching. Same reasoning as
  // layoutSlots: overlapping targets make the child's choice ambiguous.
  if (radius > 0) {
    const need = radius * 2.2 * (n - 1) + radius * 2.04
    if (maxX - minX < need) {
      const cx = (minX + maxX) / 2
      const half = Math.min(need / 2, (lim.maxX - lim.minX) / 2)
      minX = Math.max(lim.minX + radius, cx - half + radius)
      maxX = Math.min(lim.maxX - radius, cx + half - radius)
      if (maxX <= minX) {
        minX = lim.minX + radius
        maxX = lim.maxX - radius
      }
    }
  }

  return Array.from({ length: n }, (_, i) => ({
    x: lerp(minX, maxX, i / (n - 1)),
    y: cy,
  }))
}

/** A flat play-area limit, for radius fitting when the layout is a single row. */
export const ROW_LIMIT = { minX: 0.05, maxX: 0.95, minY: 0.42, maxY: 0.58 }
