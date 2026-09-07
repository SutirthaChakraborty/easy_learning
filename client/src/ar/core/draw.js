/**
 * Canvas-2D renderer for the AR layer.
 *
 * The camera image itself is a plain `<video>` behind the canvas (CSS-mirrored)
 * — drawing 30 fps of video through the canvas would cost 40 % of our frame
 * budget for no visual gain. This module only paints what is *added* to the
 * world: targets, cursors, skeletons, particles, paths.
 *
 * Everything takes stage-space coordinates (0..1) and a `view` describing the
 * pixel size, so a game never deals in pixels and never breaks on resize.
 */

/** Palette chosen for contrast against arbitrary camera backgrounds. */
export const PALETTE = {
  blue: '#3d9bff',
  green: '#38d477',
  orange: '#ff9f2e',
  red: '#ff5c72',
  purple: '#b98cff',
  yellow: '#ffd93d',
  pink: '#ff7ac0',
  teal: '#2ee6d0',
  slate: '#8ba3c7',
  white: '#ffffff',
}

export const PALETTE_KEYS = Object.keys(PALETTE)

/** High-contrast variant used when `settings.highContrast` is on. */
export const PALETTE_HC = {
  blue: '#0057ff',
  green: '#00b34a',
  orange: '#ff7a00',
  red: '#e60028',
  purple: '#8b00ff',
  yellow: '#ffd400',
  pink: '#ff0090',
  teal: '#00c3b0',
  slate: '#54708f',
  white: '#ffffff',
}

/**
 * Colour words the content library uses that are not in the palette.
 *
 * These MUST resolve to hex. `parseInt('brown', 16)` returns 11 — a valid
 * number — so an unmapped name does not fail loudly, it silently renders
 * near-black. That is how the brown "Cupboard" bin ended up looking like a
 * black hole. Any new colour word in a content pack belongs here.
 */
const NAMED = {
  black: '#1c2230',
  white: '#f4f7fd',
  grey: '#8ba3c7',
  gray: '#8ba3c7',
  brown: '#a2703f',
  cyan: '#3ee0f0',
  gold: '#f2c14e',
  silver: '#c9d4e2',
  copper: '#c8763c',
  // A single swatch cannot be a rainbow; a saturated violet is the least
  // misleading stand-in, and rainbow items are never the answer to a
  // colour-naming question.
  rainbow: '#a06bff',
  beige: '#e0cfa9',
  navy: '#2b3f7a',
  lime: '#8fe14a',
  magenta: '#ff5cc8',
  transparent: '#8ba3c7',
}

export function colorOf(name, highContrast = false) {
  const table = highContrast ? PALETTE_HC : PALETTE
  if (!name) return PALETTE.blue
  if (table[name]) return table[name]
  if (NAMED[name]) return NAMED[name]
  // A raw hex value passes through; anything else falls back visibly rather
  // than being mis-parsed into near-black.
  if (/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i.test(name)) return name
  if (/^rgba?\(/i.test(name)) return name
  console.warn(`[ar/draw] unknown colour "${name}" — add it to NAMED in draw.js`)
  return PALETTE.slate
}

/**
 * Builds the view object games and draw calls share.
 * @param {CanvasRenderingContext2D} ctx
 */
export function makeView(ctx, cssW, cssH, dpr) {
  const short = Math.min(cssW, cssH)
  return {
    ctx,
    w: cssW,
    h: cssH,
    dpr,
    short,
    /** stage-space → pixels */
    px: (u) => u * cssW,
    py: (v) => v * cssH,
    /** stage-space radius (short-side fraction) → pixels */
    pr: (r) => r * short,
  }
}

export function clear(view) {
  view.ctx.clearRect(0, 0, view.w, view.h)
}

/** Dims the camera feed so overlay graphics stay legible on a bright room. */
export function scrim(view, alpha = 0.22) {
  const { ctx } = view
  ctx.save()
  ctx.fillStyle = `rgba(6, 10, 24, ${alpha})`
  ctx.fillRect(0, 0, view.w, view.h)
  ctx.restore()
}

/** Soft edge vignette — pulls the eye to the centre of the play area. */
export function vignette(view, strength = 0.4) {
  const { ctx } = view
  const g = ctx.createRadialGradient(
    view.w / 2,
    view.h / 2,
    view.short * 0.25,
    view.w / 2,
    view.h / 2,
    view.short * 0.85
  )
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(2,6,18,${strength})`)
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(0, 0, view.w, view.h)
  ctx.restore()
}

// ── shapes ───────────────────────────────────────────────────────────────────
/**
 * Draws a named geometric shape centred at (cx, cy) with radius r.
 * These are the referents for "touch the triangle", so they must be
 * unmistakable — regular, filled, with a heavy outline.
 */
export function shapePath(ctx, name, cx, cy, r) {
  ctx.beginPath()
  switch (name) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      break
    case 'oval':
      ctx.ellipse(cx, cy, r, r * 0.68, 0, 0, Math.PI * 2)
      break
    case 'square':
      ctx.rect(cx - r * 0.82, cy - r * 0.82, r * 1.64, r * 1.64)
      break
    case 'rectangle':
      ctx.rect(cx - r, cy - r * 0.62, r * 2, r * 1.24)
      break
    case 'triangle':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r * 0.92, cy + r * 0.72)
      ctx.lineTo(cx - r * 0.92, cy + r * 0.72)
      ctx.closePath()
      break
    case 'diamond':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r * 0.8, cy)
      ctx.lineTo(cx, cy + r)
      ctx.lineTo(cx - r * 0.8, cy)
      ctx.closePath()
      break
    case 'star':
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2
        const rad = i % 2 === 0 ? r : r * 0.46
        const x = cx + Math.cos(ang) * rad
        const y = cy + Math.sin(ang) * rad
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      break
    case 'pentagon':
    case 'hexagon': {
      const n = name === 'pentagon' ? 5 : 6
      for (let i = 0; i < n; i++) {
        const ang = ((Math.PI * 2) / n) * i - Math.PI / 2
        const x = cx + Math.cos(ang) * r
        const y = cy + Math.sin(ang) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      break
    }
    case 'heart': {
      const s = r / 16
      ctx.moveTo(cx, cy + 11 * s)
      ctx.bezierCurveTo(cx - 18 * s, cy - 2 * s, cx - 11 * s, cy - 16 * s, cx, cy - 7 * s)
      ctx.bezierCurveTo(cx + 11 * s, cy - 16 * s, cx + 18 * s, cy - 2 * s, cx, cy + 11 * s)
      ctx.closePath()
      break
    }
    case 'cross':
      ctx.rect(cx - r * 0.3, cy - r, r * 0.6, r * 2)
      ctx.rect(cx - r, cy - r * 0.3, r * 2, r * 0.6)
      break
    case 'arrow':
      ctx.moveTo(cx - r * 0.9, cy - r * 0.3)
      ctx.lineTo(cx + r * 0.1, cy - r * 0.3)
      ctx.lineTo(cx + r * 0.1, cy - r * 0.75)
      ctx.lineTo(cx + r * 0.95, cy)
      ctx.lineTo(cx + r * 0.1, cy + r * 0.75)
      ctx.lineTo(cx + r * 0.1, cy + r * 0.3)
      ctx.lineTo(cx - r * 0.9, cy + r * 0.3)
      ctx.closePath()
      break
    default:
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
  }
}

// ── targets ──────────────────────────────────────────────────────────────────
/**
 * The one visual every tap-style game uses.
 *
 * @param {object} view
 * @param {object} t target: {x, y, radius, color, sprite:{kind,value}, label}
 * @param {object} state {
 *   progress: 0..1 dwell,      hover: bool,
 *   highlight: bool,           // prompt-stage highlight
 *   pulse: 0..1,               // ambient attention pulse (0 when reduced motion)
 *   dim: bool, correct: bool, wrong: bool, ghost: bool,
 *   reducedMotion: bool, highContrast: bool
 * }
 */
export function drawTarget(view, t, state = {}) {
  const { ctx } = view
  const cx = view.px(t.x)
  const cy = view.py(t.y)
  const baseR = view.pr(t.radius ?? 0.1)
  const hc = state.highContrast
  const color = colorOf(t.color, hc)

  const pulse = state.reducedMotion ? 0 : (state.pulse ?? 0)
  const grow = 1 + pulse * 0.06 + (state.hover ? 0.05 : 0) + (state.correct ? 0.16 : 0)
  const r = baseR * grow

  ctx.save()

  if (state.ghost) ctx.globalAlpha = 0.28
  else if (state.dim) ctx.globalAlpha = 0.42

  // Attention halo: only for a prompt-stage highlight or a completed answer,
  // never as constant decoration (visual clutter is a real barrier here).
  if (state.highlight || state.correct) {
    const haloR = r * (state.correct ? 1.75 : 1.5 + pulse * 0.2)
    const g = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, haloR)
    g.addColorStop(0, hexA(state.correct ? PALETTE.green : color, 0.5))
    g.addColorStop(1, hexA(state.correct ? PALETTE.green : color, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2)
    ctx.fill()
  }

  // Body — a bubble, not a flat disc: children read the highlight as "pressable".
  const body = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
  body.addColorStop(0, lighten(color, 0.3))
  body.addColorStop(1, darken(color, 0.22))
  ctx.fillStyle = body
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = r * 0.5
  ctx.shadowOffsetY = r * 0.12
  const shape = t.sprite?.kind === 'shape' ? t.sprite.value : 'circle'
  shapePath(ctx, shape, cx, cy, r)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.lineWidth = Math.max(3, r * 0.11)
  ctx.strokeStyle = hc ? '#03060f' : 'rgba(255,255,255,0.82)'
  shapePath(ctx, shape, cx, cy, r)
  ctx.stroke()

  // Sprite content
  if (t.sprite && t.sprite.kind !== 'shape') drawSprite(view, t.sprite, cx, cy, r, hc)

  // Dwell ring — the child sees their own selection filling up, which is what
  // makes dwell selection feel deliberate instead of magic.
  const prog = state.progress ?? 0
  if (prog > 0.02 && !state.correct) {
    ctx.beginPath()
    ctx.lineWidth = Math.max(4, r * 0.15)
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.strokeStyle = PALETTE.white
    ctx.arc(cx, cy, r * 1.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog)
    ctx.stroke()
  }

  // A tick for correct; a neutral dashed ring for "let's look again" — never a
  // red cross.
  if (state.correct) drawTick(ctx, cx, cy, r)
  if (state.wrong) {
    ctx.beginPath()
    ctx.setLineDash([r * 0.3, r * 0.22])
    ctx.lineWidth = Math.max(3, r * 0.12)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (t.label && !t.sprite) {
    drawFittedText(ctx, t.label, cx, cy, r * 1.5, r * 0.9, hc)
  }

  ctx.restore()

  // Caption under the bubble — the text channel, always available.
  if (t.caption) {
    // Targets sit at least 2.2 radii apart, so a caption may be at most ~2.1
    // radii wide or neighbouring labels collide and become unreadable — which
    // for a child who relies on the written channel means losing the prompt
    // entirely. Wrap to two lines, then shrink, then (last resort) trim.
    drawCaption(ctx, t.caption, cx, cy + baseR * 1.3, baseR * 2.1, baseR, {
      alpha: state.dim ? 0.5 : 1,
    })
  }
}

/** Centred, outlined, wrapped label. Max two lines. */
export function drawCaption(ctx, text, cx, top, maxW, r, opts = {}) {
  ctx.save()
  ctx.globalAlpha = opts.alpha ?? 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  let size = Math.max(10, Math.min(r * 0.34, 17))
  const setFont = () => {
    ctx.font = `600 ${size}px Fredoka, system-ui, sans-serif`
  }
  setFont()

  const wrap = () => {
    if (ctx.measureText(text).width <= maxW) return [text]
    const words = String(text).split(/\s+/)
    if (words.length === 1) return [text]
    // Split at the point that balances the two lines best.
    let best = null
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ')
      const b = words.slice(i).join(' ')
      const wide = Math.max(ctx.measureText(a).width, ctx.measureText(b).width)
      if (!best || wide < best.wide) best = { a, b, wide }
    }
    return [best.a, best.b]
  }

  let lines = wrap()
  // Shrink until the widest line fits, but never below legibility.
  for (let i = 0; i < 8; i++) {
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    if (widest <= maxW || size <= 9) break
    size *= 0.9
    setFont()
    lines = wrap()
  }
  // Still too long (one very long word): trim it rather than let it collide.
  lines = lines.map((l) => {
    if (ctx.measureText(l).width <= maxW) return l
    let cut = l
    while (cut.length > 2 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1)
    return `${cut}…`
  })

  ctx.lineWidth = Math.max(2.5, size * 0.28)
  ctx.strokeStyle = 'rgba(3,7,18,0.9)'
  lines.forEach((line, i) => {
    const y = top + i * size * 1.12
    ctx.strokeText(line, cx, y)
    ctx.fillStyle = '#fff'
    ctx.fillText(line, cx, y)
  })
  ctx.restore()
}

function drawSprite(view, sprite, cx, cy, r, hc) {
  const { ctx } = view
  if (sprite.kind === 'emoji') {
    ctx.font = `${r * 1.15}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(sprite.value, cx, cy + r * 0.04)
    return
  }
  if (sprite.kind === 'text') {
    drawFittedText(ctx, String(sprite.value), cx, cy, r * 1.55, r * 1.05, hc)
    return
  }
  if (sprite.kind === 'dots') {
    // Quantity representation for the number-sense games: an arranged cluster
    // is countable in a way a random scatter is not.
    const n = Number(sprite.value) || 0
    const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 9 ? 3 : 4
    const rows = Math.ceil(n / cols)
    const dr = Math.max(2.5, r / (Math.max(cols, rows) * 2.6))
    const gapX = r * 1.05 / Math.max(cols, 1)
    const gapY = r * 1.05 / Math.max(rows, 1)
    ctx.fillStyle = hc ? '#03060f' : 'rgba(255,255,255,0.95)'
    for (let i = 0; i < n; i++) {
      const c = i % cols
      const rr = Math.floor(i / cols)
      const x = cx + (c - (cols - 1) / 2) * gapX * 1.5
      const y = cy + (rr - (rows - 1) / 2) * gapY * 1.6
      ctx.beginPath()
      ctx.arc(x, y, dr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** Shrinks text until it fits — letters, numbers and words all use one call. */
export function drawFittedText(ctx, text, cx, cy, maxW, maxH, hc = false) {
  let size = maxH
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 14; i++) {
    ctx.font = `800 ${size}px Fredoka, system-ui, sans-serif`
    if (ctx.measureText(text).width <= maxW) break
    size *= 0.88
  }
  ctx.lineWidth = Math.max(3, size * 0.14)
  ctx.strokeStyle = hc ? '#ffffff' : 'rgba(3,7,18,0.7)'
  ctx.strokeText(text, cx, cy)
  ctx.fillStyle = hc ? '#03060f' : '#ffffff'
  ctx.fillText(text, cx, cy)
}

function drawTick(ctx, cx, cy, r) {
  ctx.save()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(4, r * 0.2)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.42, cy + r * 0.03)
  ctx.lineTo(cx - r * 0.1, cy + r * 0.36)
  ctx.lineTo(cx + r * 0.46, cy - r * 0.34)
  ctx.stroke()
  ctx.restore()
}

// ── cursors and skeletons ────────────────────────────────────────────────────
/**
 * The child's pointer. A visible, responsive cursor is the single biggest
 * factor in whether an AR reach feels controllable.
 */
export function drawHandCursor(view, hand, opts = {}) {
  if (!hand) return
  const { ctx } = view
  const cx = view.px(hand.tip.x)
  const cy = view.py(hand.tip.y)
  const r = view.pr(0.03)
  const color = hand.side === 'left' ? PALETTE.teal : PALETTE.yellow
  const trail = opts.trail

  ctx.save()
  if (trail?.length > 1 && !opts.reducedMotion) {
    ctx.lineCap = 'round'
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1]
      const b = trail[i]
      ctx.globalAlpha = (i / trail.length) * 0.5
      ctx.lineWidth = r * 0.5 * (i / trail.length) + 1
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(view.px(a.x), view.py(a.y))
      ctx.lineTo(view.px(b.x), view.py(b.y))
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6)
  g.addColorStop(0, hexA(color, 0.55))
  g.addColorStop(1, hexA(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, r * (hand.pinching ? 0.62 : 1), 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.lineWidth = Math.max(2, r * 0.3)
  ctx.strokeStyle = color
  ctx.stroke()

  // Pinch is a distinct visual state, because Grab/Drag depends on the child
  // knowing whether they are currently holding something.
  if (hand.pinching) {
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2)
    ctx.lineWidth = Math.max(2, r * 0.22)
    ctx.strokeStyle = hexA(color, 0.85)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawSkeleton(view, points, bones, opts = {}) {
  if (!points) return
  const { ctx } = view
  const color = opts.color || 'rgba(255,255,255,0.55)'
  ctx.save()
  ctx.globalAlpha = opts.alpha ?? 0.7
  ctx.strokeStyle = color
  ctx.lineWidth = opts.lineWidth ?? Math.max(2, view.short * 0.005)
  ctx.lineCap = 'round'
  for (const [a, b] of bones) {
    const p = points[a]
    const q = points[b]
    if (!p || !q) continue
    if ((p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue
    ctx.beginPath()
    ctx.moveTo(view.px(p.x), view.py(p.y))
    ctx.lineTo(view.px(q.x), view.py(q.y))
    ctx.stroke()
  }
  if (opts.joints) {
    ctx.fillStyle = color
    const jr = opts.jointRadius ?? Math.max(2, view.short * 0.006)
    for (const p of points) {
      if (!p || (p.visibility ?? 1) < 0.4) continue
      ctx.beginPath()
      ctx.arc(view.px(p.x), view.py(p.y), jr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/**
 * The animated demonstration hand of prompt stage A: an index-finger pointer
 * that travels from the bottom of the frame to the answer, loops, and shows
 * exactly what the child should do.
 */
export function drawDemoHand(view, from, to, phase, opts = {}) {
  const { ctx } = view
  const t = easeInOut(phase)
  const x = view.px(from.x + (to.x - from.x) * t)
  const y = view.py(from.y + (to.y - from.y) * t)
  const r = view.pr(0.042)

  ctx.save()
  ctx.globalAlpha = 0.9 * (phase > 0.86 ? (1 - phase) / 0.14 : 1)

  // Ghost trail towards the answer
  ctx.setLineDash([r * 0.5, r * 0.5])
  ctx.lineWidth = Math.max(2, r * 0.16)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath()
  ctx.moveTo(view.px(from.x), view.py(from.y))
  ctx.lineTo(view.px(to.x), view.py(to.y))
  ctx.stroke()
  ctx.setLineDash([])

  ctx.font = `${r * 2.1}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(opts.glyph || '👆', x, y + r * 0.5)
  ctx.restore()
}

// ── particles ────────────────────────────────────────────────────────────────
/**
 * A tiny fixed-capacity particle system. Pre-allocated so a burst never
 * triggers a GC pause mid-reach.
 */
export class Particles {
  constructor(capacity = 220) {
    this.pool = Array.from({ length: capacity }, () => ({
      alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#fff', spin: 0, rot: 0, kind: 'dot',
    }))
    this.cursor = 0
  }

  spawn(n, opts) {
    for (let i = 0; i < n; i++) {
      const p = this.pool[this.cursor]
      this.cursor = (this.cursor + 1) % this.pool.length
      const ang = opts.angle ?? (Math.PI * 2 * i) / n + (i % 2) * 0.3
      const spd = (opts.speed ?? 0.5) * (0.55 + ((i * 37) % 100) / 145)
      p.alive = true
      p.x = opts.x
      p.y = opts.y
      p.vx = Math.cos(ang) * spd
      p.vy = Math.sin(ang) * spd - (opts.lift ?? 0)
      p.max = opts.life ?? 0.75
      p.life = p.max
      p.size = opts.size ?? 4
      p.color = Array.isArray(opts.color) ? opts.color[i % opts.color.length] : opts.color || '#fff'
      p.kind = opts.kind || 'dot'
      p.spin = ((i % 7) - 3) * 4
      p.rot = 0
      p.gravity = opts.gravity ?? 0.55
    }
  }

  /** Celebration burst at a target. */
  burst(x, y, color) {
    this.spawn(22, { x, y, speed: 0.62, life: 0.72, size: 5, color: [color, '#fff', PALETTE.yellow], lift: 0.15 })
  }

  /** Round-complete confetti from the top of the frame. */
  confetti() {
    for (let i = 0; i < 60; i++) {
      this.spawn(1, {
        x: 0.04 + ((i * 17) % 92) / 100,
        y: -0.05,
        angle: Math.PI / 2 + (((i % 5) - 2) * 0.18),
        speed: 0.22 + ((i % 9) / 40),
        life: 2.4,
        size: 6,
        gravity: 0.28,
        kind: 'flake',
        color: [PALETTE.blue, PALETTE.green, PALETTE.yellow, PALETTE.pink, PALETTE.purple, PALETTE.teal],
      })
    }
  }

  step(dt) {
    for (const p of this.pool) {
      if (!p.alive) continue
      p.life -= dt
      if (p.life <= 0) {
        p.alive = false
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += p.gravity * dt
      p.rot += p.spin * dt
    }
  }

  draw(view) {
    const { ctx } = view
    ctx.save()
    for (const p of this.pool) {
      if (!p.alive) continue
      const a = Math.max(0, p.life / p.max)
      ctx.globalAlpha = a
      ctx.fillStyle = p.color
      const x = view.px(p.x)
      const y = view.py(p.y)
      const s = p.size * (0.5 + a * 0.7)
      if (p.kind === 'flake') {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.rot)
        ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.9)
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(x, y, s, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  clear() {
    for (const p of this.pool) p.alive = false
  }
}

// ── paths, zones, meters ─────────────────────────────────────────────────────
export function drawPath(view, path, opts = {}) {
  if (!path?.length) return
  const { ctx } = view
  const width = view.pr(opts.width ?? 0.09)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Road casing
  ctx.strokeStyle = opts.casing || 'rgba(255,255,255,0.28)'
  ctx.lineWidth = width
  stroke(ctx, view, path)

  // Progress fill up to `visitedIndex`
  if (opts.visitedIndex > 0) {
    ctx.strokeStyle = opts.fill || PALETTE.green
    ctx.lineWidth = width * 0.62
    stroke(ctx, view, path.slice(0, Math.min(opts.visitedIndex + 1, path.length)))
  }

  // Dashed centre line
  ctx.setLineDash([width * 0.32, width * 0.4])
  ctx.lineWidth = Math.max(2, width * 0.09)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  stroke(ctx, view, path)
  ctx.setLineDash([])
  ctx.restore()
}

function stroke(ctx, view, pts) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(view.px(pts[0].x), view.py(pts[0].y))
  for (let i = 1; i < pts.length; i++) ctx.lineTo(view.px(pts[i].x), view.py(pts[i].y))
  ctx.stroke()
}

/** Free-hand ink, for Air Writing and Shape Drawing. */
export function drawInk(view, strokes, opts = {}) {
  const { ctx } = view
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = view.pr(opts.width ?? 0.016)
  ctx.strokeStyle = opts.color || PALETTE.yellow
  ctx.shadowColor = hexA(opts.color || PALETTE.yellow, 0.7)
  ctx.shadowBlur = view.pr(0.02)
  for (const s of strokes) stroke(ctx, view, s)
  ctx.restore()
}

/** A zone the child must be inside or outside (bins, bubbles, safe areas). */
export function drawZone(view, zone, state = {}) {
  const { ctx } = view
  const color = colorOf(zone.color, state.highContrast)
  const x = view.px(zone.x)
  const y = view.py(zone.y)
  ctx.save()
  if (zone.shape === 'circle') {
    const r = view.pr(zone.radius)
    const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r)
    g.addColorStop(0, hexA(color, state.active ? 0.3 : 0.12))
    g.addColorStop(1, hexA(color, state.active ? 0.55 : 0.22))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.setLineDash([r * 0.16, r * 0.12])
    ctx.lineWidth = Math.max(3, r * 0.06)
    ctx.strokeStyle = hexA(color, 0.95)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    const w = view.px(zone.w)
    const h = view.py(zone.h)
    ctx.fillStyle = hexA(color, state.active ? 0.34 : 0.14)
    roundRect(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.16)
    ctx.fill()
    ctx.lineWidth = Math.max(3, view.short * 0.006)
    ctx.strokeStyle = hexA(color, 0.9)
    roundRect(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.16)
    ctx.stroke()
  }

  if (zone.label) {
    ctx.font = `700 ${Math.max(13, view.short * 0.032)}px Fredoka, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const ly = zone.shape === 'circle' ? y - view.pr(zone.radius) - view.short * 0.03 : y - view.py(zone.h) / 2 + view.short * 0.04
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(3,7,18,0.85)'
    ctx.strokeText(zone.label, x, ly)
    ctx.fillStyle = '#fff'
    ctx.fillText(zone.label, x, ly)
  }
  if (zone.emoji) {
    ctx.font = `${view.short * 0.075}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.85
    ctx.fillText(zone.emoji, x, y)
  }
  ctx.restore()
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Beat ring for the rhythm game: shrinks towards the target on each beat. */
export function drawBeatRing(view, target, progress, opts = {}) {
  const { ctx } = view
  const cx = view.px(target.x)
  const cy = view.py(target.y)
  const r0 = view.pr(target.radius ?? 0.1)
  const r = r0 + (1 - progress) * view.pr(0.16)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(3, r0 * 0.16)
  ctx.strokeStyle = hexA(opts.color || PALETTE.yellow, 0.35 + progress * 0.6)
  ctx.stroke()
  // Perfect-timing band
  if (progress > 0.82) {
    ctx.beginPath()
    ctx.arc(cx, cy, r0 * 1.12, 0, Math.PI * 2)
    ctx.lineWidth = Math.max(2, r0 * 0.1)
    ctx.strokeStyle = hexA(PALETTE.green, 0.9)
    ctx.stroke()
  }
  ctx.restore()
}

/** Reach-envelope outline shown during calibration and in therapist mode. */
export function drawReachBox(view, box, opts = {}) {
  const { ctx } = view
  ctx.save()
  ctx.setLineDash([8, 8])
  ctx.lineWidth = 2
  ctx.strokeStyle = opts.color || 'rgba(126,232,255,0.55)'
  ctx.strokeRect(
    view.px(box.minX),
    view.py(box.minY),
    view.px(box.maxX - box.minX),
    view.py(box.maxY - box.minY)
  )
  ctx.setLineDash([])
  if (opts.label) {
    ctx.font = `600 ${Math.max(11, view.short * 0.024)}px Fredoka, system-ui, sans-serif`
    ctx.fillStyle = opts.color || 'rgba(126,232,255,0.85)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(opts.label, view.px(box.minX) + 6, view.py(box.minY) - 5)
  }
  ctx.restore()
}

/** Big centred floating text: "GO!", "FREEZE", "3", "2", "1". */
export function drawBanner(view, text, opts = {}) {
  const { ctx } = view
  const size = view.short * (opts.size ?? 0.18)
  ctx.save()
  ctx.globalAlpha = opts.alpha ?? 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${size}px Fredoka, system-ui, sans-serif`
  const x = view.w / 2
  const y = view.h * (opts.y ?? 0.42)
  ctx.lineWidth = size * 0.14
  ctx.strokeStyle = 'rgba(3,7,18,0.8)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = opts.color || '#fff'
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** Screen-edge flash used for freeze/go state changes. */
export function edgeFlash(view, color, strength) {
  if (strength <= 0) return
  const { ctx } = view
  const g = ctx.createRadialGradient(
    view.w / 2, view.h / 2, view.short * 0.3,
    view.w / 2, view.h / 2, view.short * 0.95
  )
  g.addColorStop(0, hexA(color, 0))
  g.addColorStop(1, hexA(color, 0.55 * strength))
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(0, 0, view.w, view.h)
  ctx.restore()
}

// ── colour helpers ───────────────────────────────────────────────────────────
export function hexA(hex, alpha) {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function lighten(hex, amt) {
  return mixHex(hex, '#ffffff', amt)
}
export function darken(hex, amt) {
  return mixHex(hex, '#000000', amt)
}

function mixHex(a, b, t) {
  const pa = parseHex(a)
  const pb = parseHex(b)
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

/**
 * Strict hex parse. `parseInt` alone is unsafe here: it happily reads the
 * leading hex digits out of a word like "brown" and returns 11, which renders
 * as almost black instead of failing. So the string is validated first.
 */
function parseHex(hex) {
  const raw = String(hex).trim()
  const rgb = raw.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  const h = raw.replace('#', '')
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(h)) return [139, 163, 199] // PALETTE.slate
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
