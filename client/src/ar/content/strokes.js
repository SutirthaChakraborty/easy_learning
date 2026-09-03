/**
 * A single-line stroke font for the tracing games.
 *
 * Air Writing and Shape Drawing need the *path a hand takes*, not a glyph
 * outline — and a font outline is the wrong shape entirely (tracing the outline
 * of an "A" teaches nothing about writing one). Web fonts give us no access to
 * a skeleton, so these are hand-authored: each glyph is one or more strokes,
 * each stroke a polyline in a 0..1 box with y growing downwards, drawn in the
 * order and direction a child should actually move.
 *
 * Conventions that matter pedagogically:
 *  - vertical strokes go top → bottom
 *  - circular strokes go anticlockwise from the 1-o'clock position (the
 *    standard handwriting direction for c/o/a/d/g)
 *  - the stroke order is the teaching order, so a multi-stroke glyph is traced
 *    the way it is written
 */

/** @type {Record<string, Array<Array<[number, number]>>>} */
export const STROKE_FONT = {
  // ── digits ──
  '0': [[[0.5, 0.02], [0.16, 0.2], [0.1, 0.5], [0.16, 0.8], [0.5, 0.98], [0.84, 0.8], [0.9, 0.5], [0.84, 0.2], [0.5, 0.02]]],
  '1': [[[0.24, 0.2], [0.5, 0.04], [0.5, 0.96]], [[0.24, 0.96], [0.78, 0.96]]],
  '2': [[[0.12, 0.24], [0.3, 0.06], [0.62, 0.06], [0.82, 0.24], [0.74, 0.46], [0.14, 0.94], [0.88, 0.94]]],
  '3': [[[0.14, 0.1], [0.5, 0.03], [0.8, 0.16], [0.74, 0.4], [0.46, 0.5], [0.78, 0.6], [0.82, 0.84], [0.5, 0.97], [0.14, 0.9]]],
  '4': [[[0.66, 0.04], [0.1, 0.68], [0.92, 0.68]], [[0.66, 0.34], [0.66, 0.96]]],
  '5': [[[0.84, 0.05], [0.2, 0.05], [0.18, 0.44], [0.5, 0.4], [0.8, 0.54], [0.82, 0.8], [0.5, 0.97], [0.16, 0.9]]],
  '6': [[[0.78, 0.06], [0.4, 0.14], [0.18, 0.44], [0.16, 0.74], [0.36, 0.95], [0.68, 0.95], [0.84, 0.74], [0.7, 0.54], [0.36, 0.52], [0.18, 0.66]]],
  '7': [[[0.12, 0.06], [0.88, 0.06], [0.4, 0.96]]],
  '8': [[[0.5, 0.5], [0.22, 0.38], [0.26, 0.14], [0.5, 0.04], [0.74, 0.14], [0.78, 0.38], [0.5, 0.5], [0.2, 0.64], [0.2, 0.86], [0.5, 0.97], [0.8, 0.86], [0.8, 0.64], [0.5, 0.5]]],
  '9': [[[0.8, 0.42], [0.56, 0.5], [0.28, 0.44], [0.2, 0.24], [0.34, 0.06], [0.64, 0.05], [0.82, 0.22], [0.8, 0.6], [0.6, 0.96], [0.26, 0.96]]],

  // ── upper case ──
  A: [[[0.08, 0.97], [0.5, 0.03], [0.92, 0.97]], [[0.24, 0.62], [0.76, 0.62]]],
  B: [[[0.16, 0.03], [0.16, 0.97]], [[0.16, 0.03], [0.62, 0.06], [0.8, 0.2], [0.76, 0.4], [0.56, 0.5], [0.16, 0.5]], [[0.16, 0.5], [0.66, 0.53], [0.86, 0.68], [0.82, 0.88], [0.6, 0.97], [0.16, 0.97]]],
  C: [[[0.86, 0.18], [0.6, 0.04], [0.3, 0.1], [0.12, 0.36], [0.12, 0.66], [0.3, 0.9], [0.6, 0.97], [0.86, 0.84]]],
  D: [[[0.18, 0.03], [0.18, 0.97]], [[0.18, 0.03], [0.6, 0.06], [0.84, 0.28], [0.84, 0.72], [0.6, 0.94], [0.18, 0.97]]],
  E: [[[0.86, 0.04], [0.18, 0.04], [0.18, 0.97], [0.86, 0.97]], [[0.18, 0.5], [0.7, 0.5]]],
  F: [[[0.86, 0.04], [0.18, 0.04], [0.18, 0.97]], [[0.18, 0.48], [0.7, 0.48]]],
  G: [[[0.86, 0.18], [0.58, 0.04], [0.28, 0.12], [0.12, 0.4], [0.14, 0.7], [0.34, 0.92], [0.66, 0.96], [0.86, 0.8], [0.86, 0.56], [0.56, 0.56]]],
  H: [[[0.18, 0.03], [0.18, 0.97]], [[0.82, 0.03], [0.82, 0.97]], [[0.18, 0.5], [0.82, 0.5]]],
  I: [[[0.24, 0.04], [0.76, 0.04]], [[0.5, 0.04], [0.5, 0.96]], [[0.24, 0.96], [0.76, 0.96]]],
  J: [[[0.3, 0.04], [0.84, 0.04]], [[0.64, 0.04], [0.64, 0.74], [0.5, 0.94], [0.26, 0.96], [0.12, 0.78]]],
  K: [[[0.18, 0.03], [0.18, 0.97]], [[0.84, 0.04], [0.18, 0.54]], [[0.34, 0.42], [0.86, 0.97]]],
  L: [[[0.2, 0.04], [0.2, 0.96], [0.86, 0.96]]],
  M: [[[0.1, 0.97], [0.1, 0.04], [0.5, 0.56], [0.9, 0.04], [0.9, 0.97]]],
  N: [[[0.16, 0.97], [0.16, 0.04], [0.84, 0.97], [0.84, 0.04]]],
  O: [[[0.5, 0.03], [0.2, 0.16], [0.1, 0.5], [0.2, 0.84], [0.5, 0.97], [0.8, 0.84], [0.9, 0.5], [0.8, 0.16], [0.5, 0.03]]],
  P: [[[0.18, 0.97], [0.18, 0.04], [0.64, 0.06], [0.84, 0.22], [0.8, 0.44], [0.58, 0.54], [0.18, 0.54]]],
  Q: [[[0.5, 0.03], [0.2, 0.16], [0.1, 0.5], [0.2, 0.84], [0.5, 0.97], [0.8, 0.84], [0.9, 0.5], [0.8, 0.16], [0.5, 0.03]], [[0.62, 0.7], [0.94, 1]]],
  R: [[[0.18, 0.97], [0.18, 0.04], [0.64, 0.06], [0.84, 0.22], [0.8, 0.44], [0.56, 0.54], [0.18, 0.54]], [[0.46, 0.54], [0.88, 0.97]]],
  S: [[[0.84, 0.16], [0.58, 0.03], [0.28, 0.08], [0.18, 0.28], [0.34, 0.44], [0.66, 0.54], [0.82, 0.72], [0.7, 0.92], [0.38, 0.97], [0.14, 0.86]]],
  T: [[[0.1, 0.04], [0.9, 0.04]], [[0.5, 0.04], [0.5, 0.96]]],
  U: [[[0.14, 0.04], [0.14, 0.68], [0.3, 0.92], [0.5, 0.97], [0.7, 0.92], [0.86, 0.68], [0.86, 0.04]]],
  V: [[[0.1, 0.04], [0.5, 0.96], [0.9, 0.04]]],
  W: [[[0.06, 0.04], [0.26, 0.96], [0.5, 0.4], [0.74, 0.96], [0.94, 0.04]]],
  X: [[[0.12, 0.04], [0.88, 0.96]], [[0.88, 0.04], [0.12, 0.96]]],
  Y: [[[0.12, 0.04], [0.5, 0.52], [0.88, 0.04]], [[0.5, 0.52], [0.5, 0.96]]],
  Z: [[[0.14, 0.04], [0.86, 0.04], [0.14, 0.96], [0.86, 0.96]]],

  // ── lower case (the letters children write first) ──
  a: [[[0.78, 0.34], [0.5, 0.28], [0.26, 0.38], [0.2, 0.62], [0.3, 0.86], [0.56, 0.92], [0.78, 0.78]], [[0.78, 0.28], [0.78, 0.94]]],
  b: [[[0.2, 0.04], [0.2, 0.94]], [[0.2, 0.6], [0.38, 0.4], [0.62, 0.4], [0.8, 0.58], [0.8, 0.78], [0.6, 0.94], [0.34, 0.9], [0.2, 0.76]]],
  c: [[[0.8, 0.42], [0.56, 0.3], [0.3, 0.38], [0.2, 0.6], [0.28, 0.84], [0.54, 0.94], [0.8, 0.84]]],
  d: [[[0.8, 0.04], [0.8, 0.94]], [[0.8, 0.42], [0.56, 0.3], [0.3, 0.38], [0.2, 0.6], [0.28, 0.84], [0.54, 0.94], [0.8, 0.8]]],
  e: [[[0.2, 0.66], [0.8, 0.62], [0.72, 0.38], [0.44, 0.3], [0.24, 0.46], [0.22, 0.74], [0.44, 0.94], [0.76, 0.86]]],
  f: [[[0.76, 0.1], [0.56, 0.04], [0.42, 0.16], [0.42, 0.96]], [[0.22, 0.4], [0.7, 0.4]]],
  g: [[[0.78, 0.4], [0.54, 0.3], [0.3, 0.38], [0.22, 0.58], [0.32, 0.8], [0.58, 0.86], [0.78, 0.74]], [[0.78, 0.3], [0.78, 0.94], [0.6, 1], [0.34, 0.96]]],
  h: [[[0.22, 0.04], [0.22, 0.96]], [[0.22, 0.56], [0.42, 0.36], [0.66, 0.38], [0.78, 0.56], [0.78, 0.96]]],
  i: [[[0.5, 0.36], [0.5, 0.96]], [[0.5, 0.12], [0.5, 0.2]]],
  j: [[[0.6, 0.36], [0.6, 0.88], [0.44, 1], [0.24, 0.96]], [[0.6, 0.12], [0.6, 0.2]]],
  k: [[[0.22, 0.04], [0.22, 0.96]], [[0.78, 0.36], [0.24, 0.7]], [[0.4, 0.6], [0.8, 0.96]]],
  l: [[[0.46, 0.04], [0.46, 0.84], [0.62, 0.96]]],
  m: [[[0.14, 0.96], [0.14, 0.36]], [[0.14, 0.5], [0.3, 0.36], [0.46, 0.44], [0.48, 0.96]], [[0.48, 0.5], [0.64, 0.36], [0.82, 0.44], [0.86, 0.96]]],
  n: [[[0.22, 0.96], [0.22, 0.36]], [[0.22, 0.52], [0.42, 0.36], [0.66, 0.4], [0.78, 0.58], [0.78, 0.96]]],
  o: [[[0.5, 0.3], [0.26, 0.42], [0.2, 0.62], [0.3, 0.86], [0.54, 0.94], [0.78, 0.82], [0.82, 0.58], [0.7, 0.36], [0.5, 0.3]]],
  p: [[[0.22, 0.36], [0.22, 1]], [[0.22, 0.56], [0.42, 0.38], [0.66, 0.4], [0.8, 0.58], [0.76, 0.8], [0.5, 0.92], [0.26, 0.84]]],
  q: [[[0.78, 0.36], [0.78, 1]], [[0.78, 0.5], [0.58, 0.32], [0.32, 0.38], [0.2, 0.58], [0.26, 0.8], [0.52, 0.92], [0.78, 0.82]]],
  r: [[[0.28, 0.96], [0.28, 0.36]], [[0.28, 0.54], [0.46, 0.38], [0.74, 0.36]]],
  s: [[[0.76, 0.42], [0.5, 0.3], [0.28, 0.38], [0.3, 0.56], [0.6, 0.66], [0.74, 0.8], [0.56, 0.94], [0.26, 0.9]]],
  t: [[[0.46, 0.1], [0.46, 0.82], [0.64, 0.96]], [[0.22, 0.36], [0.72, 0.36]]],
  u: [[[0.22, 0.36], [0.22, 0.78], [0.42, 0.94], [0.66, 0.9], [0.78, 0.74], [0.78, 0.36]], [[0.78, 0.74], [0.78, 0.96]]],
  v: [[[0.16, 0.36], [0.5, 0.96], [0.84, 0.36]]],
  w: [[[0.1, 0.36], [0.28, 0.96], [0.5, 0.56], [0.72, 0.96], [0.9, 0.36]]],
  x: [[[0.2, 0.36], [0.8, 0.96]], [[0.8, 0.36], [0.2, 0.96]]],
  y: [[[0.2, 0.36], [0.5, 0.9], [0.8, 0.36]], [[0.5, 0.9], [0.36, 1]]],
  z: [[[0.2, 0.36], [0.8, 0.36], [0.2, 0.96], [0.8, 0.96]]],
}

/**
 * Geometric shapes as traceable outlines. Closed shapes end where they start,
 * which is what "draw a circle" actually means.
 */
export const SHAPE_STROKES = {
  circle: [circlePts(0.5, 0.5, 0.46, 40)],
  oval: [ellipsePts(0.5, 0.5, 0.46, 0.32, 40)],
  square: [[[0.08, 0.08], [0.92, 0.08], [0.92, 0.92], [0.08, 0.92], [0.08, 0.08]]],
  rectangle: [[[0.05, 0.22], [0.95, 0.22], [0.95, 0.78], [0.05, 0.78], [0.05, 0.22]]],
  triangle: [[[0.5, 0.06], [0.94, 0.9], [0.06, 0.9], [0.5, 0.06]]],
  diamond: [[[0.5, 0.04], [0.94, 0.5], [0.5, 0.96], [0.06, 0.5], [0.5, 0.04]]],
  star: [starPts(0.5, 0.52, 0.46, 0.19)],
  cross: [[[0.5, 0.06], [0.5, 0.94]], [[0.06, 0.5], [0.94, 0.5]]],
  heart: [heartPts(48)],
  pentagon: [polyPts(0.5, 0.52, 0.46, 5)],
  hexagon: [polyPts(0.5, 0.5, 0.46, 6)],
  zigzag: [[[0.06, 0.3], [0.3, 0.72], [0.5, 0.3], [0.7, 0.72], [0.94, 0.3]]],
  spiral: [spiralPts(56)],
  wave: [wavePts(40)],
}

function circlePts(cx, cy, r, n) {
  return Array.from({ length: n + 1 }, (_, i) => {
    // Anticlockwise from 1 o'clock — the handwriting direction for o and c.
    const a = -Math.PI / 4 - (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })
}

function ellipsePts(cx, cy, rx, ry, n) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = -Math.PI / 4 - (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  })
}

function polyPts(cx, cy, r, sides) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })
  return [...pts, pts[0]]
}

function starPts(cx, cy, outer, inner) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })
  return [...pts, pts[0]]
}

function heartPts(n) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = Math.PI + (i / n) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    return [0.5 + x / 38, 0.48 + y / 38]
  })
}

function spiralPts(n) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * Math.PI * 4.2
    const r = 0.05 + (i / (n - 1)) * 0.42
    return [0.5 + Math.cos(t) * r, 0.5 + Math.sin(t) * r * 0.95]
  })
}

function wavePts(n) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return [0.05 + t * 0.9, 0.5 + Math.sin(t * Math.PI * 3) * 0.3]
  })
}

/**
 * Resamples a polyline to evenly spaced points, so PathTracer's coverage metric
 * is not skewed by long straight segments having fewer waypoints than curves.
 *
 * @param {Array<[number,number]>} pts
 * @param {number} spacing target gap between samples, in the same 0..1 units
 * @returns {Array<{x:number,y:number}>}
 */
export function resample(pts, spacing = 0.02) {
  if (!pts?.length) return []
  const out = [{ x: pts[0][0], y: pts[0][1] }]
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const seg = Math.hypot(x1 - x0, y1 - y0)
    if (seg < 1e-9) continue
    let t = (spacing - carry) / seg
    while (t <= 1) {
      out.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t })
      t += spacing / seg
    }
    carry = (carry + seg) % spacing
  }
  const last = pts[pts.length - 1]
  out.push({ x: last[0], y: last[1] })
  return out
}

/** Chaikin smoothing — takes the corners off a hand-authored polyline. */
export function smooth(points, iterations = 2) {
  let pts = points
  for (let k = 0; k < iterations; k++) {
    if (pts.length < 3) break
    const next = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 })
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}

/**
 * Places a glyph's strokes into a box in stage space.
 *
 * @param {string} glyph  a key of STROKE_FONT, or a key of SHAPE_STROKES
 * @param {{x:number,y:number,w:number,h:number}} box stage-space box
 * @param {{spacing?:number, smoothing?:number}} opts
 * @returns {Array<Array<{x:number,y:number}>>} strokes of stage-space points
 */
export function glyphStrokes(glyph, box, opts = {}) {
  const src = STROKE_FONT[glyph] || SHAPE_STROKES[glyph]
  if (!src) return []
  const spacing = opts.spacing ?? 0.03
  return src.map((stroke) => {
    const placed = stroke.map(([x, y]) => [box.x + x * box.w, box.y + y * box.h])
    const dense = resample(placed, spacing)
    return opts.smoothing === 0 ? dense : smooth(dense, opts.smoothing ?? 1)
  })
}

export const TRACEABLE_SHAPES = Object.keys(SHAPE_STROKES)
export const TRACEABLE_GLYPHS = Object.keys(STROKE_FONT)
