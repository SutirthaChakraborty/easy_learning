/**
 * Multisensory feedback: haptics, synthesised audio and spoken prompts.
 *
 * Two design rules, both clinical rather than technical:
 *  1. Feedback has three classes — correct, *almost* (right answer, imprecise
 *     or late execution) and neutral-retry. There is no buzzer and no
 *     points-lost sound, because a child with slow motor execution would be
 *     punished for latency they cannot control.
 *  2. Every channel is independently attenuable. Sensory intensity is a
 *     setting, not a constant.
 *
 * Audio is synthesised with WebAudio instead of loading mp3s: no network wait,
 * no first-play delay, and the pitch/length of every cue can track difficulty.
 */
import { getSettings, onSettingsChange } from './settings'

// ── haptics ──────────────────────────────────────────────────────────────────
const PATTERNS = {
  tap: [18],
  hover: [8],
  tick: [10],
  correct: [26, 40, 26],
  almost: [16, 60, 16],
  neutral: [12],
  start: [30, 60, 30, 60, 60],
  finish: [40, 50, 40, 50, 90],
  warn: [70],
  beat: [14],
}

const haptCaps = {
  vibrate: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
  gamepad: false,
  audioThump: true,
  iosSwitch: false,
}

let lastHaptic = 0

/**
 * A paired game controller gives real, strong haptics on iPads and Macs where
 * `navigator.vibrate` does not exist — worth using when one is connected.
 */
function gamepadActuator() {
  if (typeof navigator?.getGamepads !== 'function') return null
  for (const gp of navigator.getGamepads()) {
    const act = gp?.vibrationActuator
    if (act?.playEffect) return act
  }
  return null
}

if (typeof window !== 'undefined') {
  const refresh = () => {
    haptCaps.gamepad = Boolean(gamepadActuator())
  }
  window.addEventListener('gamepadconnected', refresh)
  window.addEventListener('gamepaddisconnected', refresh)
  // iOS 17.4+ fires Taptic feedback when a `switch`-styled checkbox toggles.
  // Best-effort only; we still play the audio thump underneath.
  haptCaps.iosSwitch = /iP(hone|ad|od)/.test(navigator.userAgent || '')
}

let iosSwitchEl = null
function iosTaptic() {
  if (!haptCaps.iosSwitch) return false
  try {
    if (!iosSwitchEl) {
      iosSwitchEl = document.createElement('input')
      iosSwitchEl.type = 'checkbox'
      iosSwitchEl.setAttribute('switch', '')
      Object.assign(iosSwitchEl.style, {
        position: 'fixed',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
        left: '-9999px',
      })
      document.body.appendChild(iosSwitchEl)
    }
    iosSwitchEl.checked = !iosSwitchEl.checked
    iosSwitchEl.dispatchEvent(new Event('change', { bubbles: false }))
    return true
  } catch {
    return false
  }
}

/**
 * Fires every haptic channel available. Returns the channels actually used so
 * the settings screen can show the therapist what this device supports.
 */
export function haptic(kind = 'tap', { force = false } = {}) {
  const s = getSettings()
  if (!s.haptics && !force) return []
  const now = performance.now()
  // Rate-limit: continuous buzzing is aversive and drains battery.
  if (!force && now - lastHaptic < 45) return []
  lastHaptic = now

  const base = PATTERNS[kind] || PATTERNS.tap
  const gain = s.hapticIntensity ?? 1
  const pattern = base.map((ms, i) => (i % 2 === 0 ? Math.max(6, Math.round(ms * gain)) : ms))
  const used = []

  if (haptCaps.vibrate) {
    try {
      navigator.vibrate(pattern)
      used.push('vibrate')
    } catch {
      /* some browsers throw when the page is hidden */
    }
  }

  const act = gamepadActuator()
  if (act) {
    const strong = Math.min(1, 0.55 * gain + (kind === 'correct' || kind === 'finish' ? 0.3 : 0))
    act
      .playEffect('dual-rumble', {
        startDelay: 0,
        duration: pattern.reduce((a, b) => a + b, 0),
        weakMagnitude: strong * 0.6,
        strongMagnitude: strong,
      })
      .catch(() => {})
    used.push('gamepad')
  }

  if (!used.length && iosTaptic()) used.push('taptic')

  // Sub-bass burst: on a hand-held tablet this is genuinely felt, and it is the
  // only physical channel left on iOS Safari without a controller.
  if (s.hapticAudioFallback && !used.includes('vibrate') && !used.includes('gamepad')) {
    thump(kind, gain)
    used.push('audio')
  }

  return used
}

export function hapticCapabilities() {
  return { ...haptCaps, gamepad: Boolean(gamepadActuator()) }
}

// ── audio engine ─────────────────────────────────────────────────────────────
let ctx = null
let master = null

/** WebAudio needs a user gesture; ARStage calls this from the Play button. */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      ctx = new AC({ latencyHint: 'interactive' })
      master = ctx.createGain()
      master.gain.value = getSettings().volume ?? 0.7
      master.connect(ctx.destination)
      onSettingsChange((s) => {
        if (master) master.gain.value = s.volume ?? 0.7
      })
    }
    if (ctx.state === 'suspended') ctx.resume()
    return true
  } catch (err) {
    console.warn('[ar] audio unavailable:', err?.message || err)
    return false
  }
}

export function audioReady() {
  return Boolean(ctx && ctx.state === 'running')
}

/** Current audio clock in ms, aligned to performance.now() for beat scheduling. */
export function audioNowMs() {
  return ctx ? ctx.currentTime * 1000 : performance.now()
}

function env(node, { at, attack = 0.005, hold = 0.02, release = 0.12, peak = 0.5 }) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack)
  g.gain.setValueAtTime(Math.max(peak, 0.0002), at + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release)
  node.connect(g)
  g.connect(master)
  return g
}

function tone({ freq, type = 'sine', at = 0, dur = 0.14, peak = 0.4, detune = 0, glideTo = null }) {
  if (!ctx || !master) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
  if (detune) osc.detune.setValueAtTime(detune, t)
  env(osc, { at: t, peak, release: dur })
  osc.start(t)
  osc.stop(t + dur + 0.08)
}

function noise({ at = 0, dur = 0.2, peak = 0.25, hp = 400, lp = 6000, sweep = false }) {
  if (!ctx || !master) return
  const t = ctx.currentTime + at
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  // Deterministic pseudo-noise: avoids Math.random and sounds identical every run.
  let s = 12345
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    data[i] = (s / 0x3fffffff - 1) * (1 - i / len)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(hp, t)
  if (sweep) bp.frequency.exponentialRampToValueAtTime(lp, t + dur)
  bp.Q.value = 0.9
  src.connect(bp)
  env(bp, { at: t, peak, release: dur })
  src.start(t)
  src.stop(t + dur + 0.05)
}

function thump(kind, gain = 1) {
  if (!unlockAudio()) return
  const peak = Math.min(0.9, 0.5 * gain)
  tone({ freq: 78, type: 'sine', dur: kind === 'correct' ? 0.16 : 0.09, peak, glideTo: 45 })
}

// A pentatonic ladder: consecutive correct answers climb it, which makes a
// streak audible without any "wrong" sound ever being needed.
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51]

export const sfx = {
  /** Correct answer. `streak` (0-based) walks up the ladder. */
  correct(streak = 0) {
    if (!unlockAudio()) return
    const i = Math.min(streak, LADDER.length - 3)
    tone({ freq: LADDER[i], type: 'triangle', dur: 0.11, peak: 0.34 })
    tone({ freq: LADDER[i + 1], type: 'triangle', at: 0.075, dur: 0.12, peak: 0.3 })
    tone({ freq: LADDER[i + 2], type: 'sine', at: 0.15, dur: 0.22, peak: 0.26 })
  },
  /** Right idea, imprecise or late execution — encouraging, never punitive. */
  almost() {
    if (!unlockAudio()) return
    tone({ freq: 440, type: 'triangle', dur: 0.1, peak: 0.24 })
    tone({ freq: 554.37, type: 'triangle', at: 0.09, dur: 0.16, peak: 0.2 })
  },
  /** Neutral "let's look again" — a soft low blip, deliberately not a buzzer. */
  neutral() {
    if (!unlockAudio()) return
    tone({ freq: 233.08, type: 'sine', dur: 0.13, peak: 0.2, glideTo: 196 })
  },
  /** A target appearing. */
  appear(pitch = 0) {
    if (!unlockAudio()) return
    tone({ freq: 659.25 * Math.pow(2, pitch / 12), type: 'sine', dur: 0.1, peak: 0.16 })
  },
  pop(pitch = 0) {
    if (!unlockAudio()) return
    tone({
      freq: 300 * Math.pow(2, pitch / 12),
      type: 'square',
      dur: 0.07,
      peak: 0.2,
      glideTo: 900 * Math.pow(2, pitch / 12),
    })
    noise({ dur: 0.08, peak: 0.12, hp: 1200 })
  },
  tick() {
    if (!unlockAudio()) return
    tone({ freq: 1200, type: 'square', dur: 0.028, peak: 0.14 })
  },
  /** Metronome click for the rhythm game; `accent` marks bar starts. */
  beat(accent = false) {
    if (!unlockAudio()) return
    tone({ freq: accent ? 1568 : 1046.5, type: 'square', dur: accent ? 0.05 : 0.035, peak: accent ? 0.24 : 0.16 })
  },
  whoosh() {
    if (!unlockAudio()) return
    noise({ dur: 0.28, peak: 0.16, hp: 300, lp: 4200, sweep: true })
  },
  /** Green light / go. */
  go() {
    if (!unlockAudio()) return
    tone({ freq: 523.25, type: 'triangle', dur: 0.1, peak: 0.3 })
    tone({ freq: 1046.5, type: 'sine', at: 0.08, dur: 0.16, peak: 0.24 })
  },
  /** Red light / freeze — attention-getting but not startling. */
  stop() {
    if (!unlockAudio()) return
    tone({ freq: 392, type: 'triangle', dur: 0.13, peak: 0.3 })
    tone({ freq: 311.13, type: 'triangle', at: 0.1, dur: 0.2, peak: 0.26 })
  },
  countdown(n) {
    if (!unlockAudio()) return
    tone({ freq: n <= 1 ? 880 : 587.33, type: 'triangle', dur: 0.12, peak: 0.26 })
  },
  /** Round finished — a short major fanfare. */
  fanfare() {
    if (!unlockAudio()) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) =>
      tone({ freq: f, type: 'triangle', at: i * 0.1, dur: 0.3, peak: 0.3 })
    )
    tone({ freq: 1318.51, type: 'sine', at: 0.42, dur: 0.5, peak: 0.22 })
  },
  /** Level-up / difficulty step. */
  levelUp() {
    if (!unlockAudio()) return
    ;[659.25, 830.61, 987.77].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', at: i * 0.07, dur: 0.2, peak: 0.26 })
    )
  },
  /** Coin / collect. */
  collect(n = 0) {
    if (!unlockAudio()) return
    tone({ freq: 987.77 + n * 40, type: 'square', dur: 0.05, peak: 0.16 })
    tone({ freq: 1318.51 + n * 50, type: 'square', at: 0.045, dur: 0.09, peak: 0.14 })
  },
}

// ── combined cues ────────────────────────────────────────────────────────────
/** Correct: sound + haptic in one call, so games never desynchronise them. */
export function cueCorrect(streak = 0) {
  sfx.correct(streak)
  haptic('correct')
}
export function cueAlmost() {
  sfx.almost()
  haptic('almost')
}
export function cueNeutral() {
  sfx.neutral()
  haptic('neutral')
}
export function cueTouch() {
  haptic('tap')
}
export function cueFinish() {
  sfx.fanfare()
  haptic('finish')
}
