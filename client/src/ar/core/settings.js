/**
 * Accessibility / sensory settings — persisted per device, applied everywhere.
 *
 * These are not cosmetic preferences. For this population they decide whether a
 * game is playable at all: a child with a slow motor plan needs `extraTimeX`,
 * a child who cannot stand needs `seated`, a child with one usable hand needs
 * `singleHand`, a child who is startled by movement needs `reducedMotion`.
 *
 * Nothing here is a plain module-level constant — a therapist can change any of
 * it mid-session from the in-game settings sheet and every subscriber updates.
 */

const KEY = 'ar_settings_v1'

export const DEFAULT_SETTINGS = {
  // ── sensory intensity ──
  volume: 0.7,
  speech: true,
  speechRate: 0.85, // slower than default; comprehension over speed
  haptics: true,
  hapticIntensity: 1,
  hapticAudioFallback: true, // sub-bass burst when no vibration motor exists
  reducedMotion: false, // no particles, no shake, no pulsing backgrounds
  highContrast: false,
  visualClutter: 'normal', // 'minimal' | 'normal'

  // ── motor accommodations ──
  seated: false, // keep every target within a seated reach envelope
  singleHand: 'both', // 'both' | 'left' | 'right'
  largeTargets: false, // +45 % target radius everywhere
  extraTimeX: 1, // multiplies every response window (1 = standard, 2 = double)
  dwellMs: 260, // how long a fingertip must rest on a target to select it
  handSwap: true, // MediaPipe handedness convention correction (auto-calibrated)

  // ── instruction channel ──
  instruction: 'both', // 'visual' | 'audio' | 'both'
  captions: true, // always show the prompt as text as well

  // ── clinical ──
  promptMode: 'adaptive', // 'adaptive' | fixed stage 'A'..'F'
  difficultyMode: 'adaptive', // 'adaptive' | 'fixed'
  fixedLevel: 1,
  showMetrics: false, // live latency/accuracy HUD for the therapist
  mirrorView: true,
  showSkeleton: true,

  // ── data ──
  telemetry: true, // record trial-level analysis data
  consentAt: null, // ISO timestamp of guardian consent for telemetry
}

let current = load()
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const saved = raw ? JSON.parse(raw) : {}
    const merged = { ...DEFAULT_SETTINGS, ...saved }
    // Respect the OS-level reduced-motion preference unless explicitly overridden.
    if (saved.reducedMotion === undefined && typeof window !== 'undefined') {
      merged.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
    }
    return merged
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    /* private mode — settings stay in memory for this session */
  }
}

export function getSettings() {
  return current
}

export function updateSettings(patch) {
  current = { ...current, ...patch }
  persist()
  for (const fn of listeners) {
    try {
      fn(current)
    } catch (e) {
      console.error('[ar] settings listener threw', e)
    }
  }
  return current
}

export function resetSettings() {
  return updateSettings({ ...DEFAULT_SETTINGS })
}

export function onSettingsChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Applies the motor/sensory accommodations to a game's raw difficulty numbers.
 * Called by every engine so no game can forget one.
 */
export function accommodate(spec, settings = current) {
  const out = { ...spec }
  if (settings.largeTargets) out.radius = Math.min((out.radius ?? 0.09) * 1.45, 0.2)
  if (Number.isFinite(out.windowMs) && out.windowMs > 0) {
    out.windowMs = Math.round(out.windowMs * (settings.extraTimeX || 1))
  }
  if (Number.isFinite(out.showMs) && out.showMs > 0) {
    out.showMs = Math.round(out.showMs * (settings.extraTimeX || 1))
  }
  out.dwellMs = out.dwellMs ?? settings.dwellMs
  return out
}

/**
 * The reach envelope to place targets in. Seated mode compresses the vertical
 * range; the calibrated per-child box (profile.js) overrides both.
 */
export function baseReachBox(settings = current) {
  return settings.seated
    ? { minX: 0.14, maxX: 0.86, minY: 0.2, maxY: 0.74 }
    : { minX: 0.08, maxX: 0.92, minY: 0.1, maxY: 0.9 }
}
