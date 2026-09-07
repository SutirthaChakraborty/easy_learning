/**
 * A game clock that only advances while the game is actually running.
 *
 * Every timing decision in every game reads this instead of
 * `performance.now()` / `setTimeout`. That is what makes Pause correct: a child
 * paused for 40 s mid-reach must not come back to an expired response window,
 * and their recorded latency must not include the pause. Wall-clock timers
 * cannot give us that; a virtual clock stepped from the render loop can.
 *
 * It also gives us deterministic timing under a dropped frame: `advance(dt)` is
 * clamped, so a 900 ms stall does not skip a whole trial.
 */

export class GameClock {
  constructor() {
    this.t = 0
    this.running = false
    this._timers = []
    this._seq = 0
  }

  now() {
    return this.t
  }

  start() {
    this.running = true
  }

  pause() {
    this.running = false
  }

  reset() {
    this.t = 0
    this.running = false
    this._timers.length = 0
  }

  /**
   * @param {number} dtSeconds real elapsed time since the last frame
   * @returns {number} the game-time delta actually applied, in seconds
   */
  advance(dtSeconds) {
    if (!this.running) return 0
    // A tab that was backgrounded, or a GC pause, can hand us a huge dt.
    // Clamp to ~4 frames so nothing jumps.
    const dt = Math.min(Math.max(dtSeconds, 0), 0.12)
    this.t += dt * 1000
    this._fire()
    return dt
  }

  _fire() {
    if (!this._timers.length) return
    // Iterate a copy: a callback may schedule more timers.
    const due = []
    for (let i = this._timers.length - 1; i >= 0; i--) {
      const timer = this._timers[i]
      if (timer.at <= this.t) {
        due.push(timer)
        if (timer.interval) timer.at += timer.interval
        else this._timers.splice(i, 1)
      }
    }
    due.sort((a, b) => a.at - b.at)
    for (const timer of due) {
      try {
        timer.fn(this.t)
      } catch (err) {
        console.error('[ar] clock callback threw', err)
      }
    }
  }

  /** Runs `fn` once, `ms` of *game* time from now. Returns a cancel handle. */
  after(ms, fn) {
    const id = ++this._seq
    this._timers.push({ id, at: this.t + Math.max(0, ms), fn, interval: 0 })
    return id
  }

  /** Runs `fn` every `ms` of game time. Returns a cancel handle. */
  every(ms, fn) {
    const id = ++this._seq
    const interval = Math.max(16, ms)
    this._timers.push({ id, at: this.t + interval, fn, interval })
    return id
  }

  cancel(id) {
    const i = this._timers.findIndex((t) => t.id === id)
    if (i >= 0) this._timers.splice(i, 1)
  }

  cancelAll() {
    this._timers.length = 0
  }

  /** Awaitable delay in game time — resolves early if the clock is reset. */
  wait(ms) {
    return new Promise((resolve) => this.after(ms, resolve))
  }
}

/**
 * A countdown that a game can show and that pauses with the game.
 * Used for round timers and per-trial response windows.
 */
export class Countdown {
  constructor(clock, durationMs) {
    this.clock = clock
    this.durationMs = durationMs
    this.startedAt = clock.now()
    this.finished = false
  }
  reset(durationMs) {
    if (durationMs != null) this.durationMs = durationMs
    this.startedAt = this.clock.now()
    this.finished = false
  }
  get elapsed() {
    return this.clock.now() - this.startedAt
  }
  get remaining() {
    return Math.max(0, this.durationMs - this.elapsed)
  }
  get progress() {
    return this.durationMs > 0 ? Math.min(1, this.elapsed / this.durationMs) : 0
  }
  /** True exactly once, on the frame the countdown expires. */
  expired() {
    if (this.finished || this.durationMs <= 0) return false
    if (this.remaining <= 0) {
      this.finished = true
      return true
    }
    return false
  }
}
