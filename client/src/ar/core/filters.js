/**
 * Jitter filters for landmark streams.
 *
 * Raw MediaPipe fingertips wobble by 1-2 % of the frame even when a hand is
 * perfectly still. Untreated, that wobble makes a child "tap" a target they
 * were only hovering near, and it destroys path-efficiency and timing metrics.
 * A One-Euro filter is the right tool: heavy smoothing while slow, almost none
 * while moving fast, so deliberate reaches stay responsive.
 */

const alpha = (cutoff, dt) => {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

class LowPass {
  constructor() {
    this.y = null
  }
  filter(x, a) {
    this.y = this.y === null ? x : a * x + (1 - a) * this.y
    return this.y
  }
  reset() {
    this.y = null
  }
}

/** Scalar One-Euro filter (Casiez et al., 2012). */
export class OneEuro {
  /**
   * @param {number} minCutoff Hz — lower = smoother when still.
   * @param {number} beta      speed coefficient — higher = more responsive when moving.
   * @param {number} dCutoff   Hz — cutoff for the derivative estimate.
   */
  constructor(minCutoff = 1.4, beta = 0.045, dCutoff = 1.0) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
    this.x = new LowPass()
    this.dx = new LowPass()
    this.prev = null
  }

  filter(value, dt) {
    if (!(dt > 0) || !Number.isFinite(value)) return this.x.y ?? value
    const rawDx = this.prev === null ? 0 : (value - this.prev) / dt
    const edx = this.dx.filter(rawDx, alpha(this.dCutoff, dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    this.prev = value
    return this.x.filter(value, alpha(cutoff, dt))
  }

  reset() {
    this.x.reset()
    this.dx.reset()
    this.prev = null
  }
}

/** Two One-Euro filters wired to an {x, y} point, plus a velocity estimate. */
export class PointFilter {
  constructor(opts) {
    this.fx = new OneEuro(opts?.minCutoff, opts?.beta, opts?.dCutoff)
    this.fy = new OneEuro(opts?.minCutoff, opts?.beta, opts?.dCutoff)
    this.last = null
    this.velocity = { x: 0, y: 0 }
  }

  filter(p, dt) {
    const out = { x: this.fx.filter(p.x, dt), y: this.fy.filter(p.y, dt) }
    if (this.last && dt > 0) {
      // Exponentially smoothed velocity in stage-units/second.
      const k = 0.35
      this.velocity = {
        x: this.velocity.x * (1 - k) + ((out.x - this.last.x) / dt) * k,
        y: this.velocity.y * (1 - k) + ((out.y - this.last.y) / dt) * k,
      }
    }
    this.last = out
    return out
  }

  reset() {
    this.fx.reset()
    this.fy.reset()
    this.last = null
    this.velocity = { x: 0, y: 0 }
  }
}

/**
 * Exponential moving average with a "hold" — keeps reporting the last value for
 * `holdMs` after the input drops out, so a one-frame tracking loss does not
 * yank a cursor off a target the child is holding.
 */
export class Holder {
  constructor(holdMs = 220) {
    this.holdMs = holdMs
    this.value = null
    this.lastSeen = -Infinity
  }
  push(value, now) {
    this.value = value
    this.lastSeen = now
    return value
  }
  get(now) {
    if (this.value == null) return null
    return now - this.lastSeen <= this.holdMs ? this.value : null
  }
  clear() {
    this.value = null
    this.lastSeen = -Infinity
  }
}
