/**
 * The child capability profile.
 *
 * Deliberately *not* "easy / medium / hard". Two children with the same
 * diagnosis can have opposite profiles, and one child can have excellent visual
 * discrimination alongside a very restricted reach envelope. So we keep an
 * independent estimate per functional dimension, plus a calibrated reach box,
 * and let the adaptive engine move one dimension at a time.
 *
 * Estimates are running averages over recent trials — descriptive summaries of
 * in-game behaviour, nothing more. They are explicitly not diagnostic scores.
 */
import { clamp } from './geometry'
import { baseReachBox, getSettings } from './settings'

const KEY_PREFIX = 'ar_profile_v1:'

/** Identity used to key the profile. Falls back to a device-local guest. */
export function childKey() {
  try {
    for (const k of ['jwt_token', 'firebase_jwt']) {
      const token = localStorage.getItem(k)
      if (!token) continue
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.email) return payload.email.toLowerCase()
      if (payload?.id) return String(payload.id)
    }
  } catch {
    /* malformed token — fall through to guest */
  }
  let guest = localStorage.getItem('ar_guest_id')
  if (!guest) {
    guest = `guest-${Math.random().toString(36).slice(2, 10)}`
    try {
      localStorage.setItem('ar_guest_id', guest)
    } catch {
      /* ignore */
    }
  }
  return guest
}

/** Each capability is a 0..1 estimate plus the sample count behind it. */
const emptyEstimate = () => ({ value: 0.5, n: 0 })

export const CAPABILITIES = [
  'visualDiscrimination',
  'auditoryComprehension',
  'readingSymbol',
  'reactionSpeed',
  'reachAccuracy',
  'sustainedAttention',
  'workingMemory',
  'sequencing',
  'inhibition',
  'cognitiveFlexibility',
  'bilateralCoordination',
  'motorPlanning',
  'spatialConcepts',
  'socialReasoning',
  'independence',
]

function blankProfile(key) {
  return {
    key,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Calibrated reach envelope in stage space; null until the child calibrates.
    reach: null,
    reachCalibratedAt: null,
    dominantHand: null, // 'left' | 'right' — inferred from spontaneous use
    handUse: { left: 0, right: 0 },
    // Median latency in ms, kept so response windows can be set from the
    // child's own speed rather than an arbitrary constant.
    latencyMs: null,
    capabilities: Object.fromEntries(CAPABILITIES.map((c) => [c, emptyEstimate()])),
    // Per-game adaptive state: { levelIdx, promptStage, dimIdx, streak, errors }
    games: {},
    // The visible five-level journey, points and badges. Owned by journey.js,
    // stored here so one erase takes everything about a child with it.
    journey: { points: 0, lifetimePoints: 0, byGame: {}, badges: [], days: [], updatedAt: null },
    totals: { trials: 0, sessions: 0, correct: 0 },
  }
}

let cache = null

export function loadProfile() {
  const key = childKey()
  if (cache?.key === key) return cache
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key)
    cache = raw ? { ...blankProfile(key), ...JSON.parse(raw), key } : blankProfile(key)
  } catch {
    cache = blankProfile(key)
  }
  return cache
}

export function saveProfile(profile = cache) {
  if (!profile) return
  profile.updatedAt = new Date().toISOString()
  cache = profile
  try {
    localStorage.setItem(KEY_PREFIX + profile.key, JSON.stringify(profile))
  } catch {
    /* storage full / private mode — profile lives for this session only */
  }
}

export function resetProfile() {
  const key = childKey()
  cache = blankProfile(key)
  saveProfile(cache)
  return cache
}

/**
 * Which coordinate space a stored reach calibration was measured in.
 *
 * Reach is stored as a fraction of the stage, so what those fractions *mean*
 * depends on how the camera is fitted to the screen. Boxes recorded while the
 * video was `object-fit: cover` were measured inside a centre-crop that
 * discarded up to two thirds of the camera's width; reusing those numbers now
 * that the whole frame is shown would place targets far outside the arc the
 * child actually swept. A calibration from the old space is therefore ignored
 * rather than converted — the conversion would need the exact stage aspect it
 * was captured at, which was never recorded, and *Set Up My Space* takes under
 * a minute.
 */
export const REACH_SPACE = 'contain-1'

/**
 * The reach envelope targets are placed inside.
 * Priority: calibrated box → seated/standing default from settings.
 * Always inset slightly so a target is never half off-screen.
 */
export function reachBox() {
  const p = loadProfile()
  const s = getSettings()
  const base = baseReachBox(s)
  if (!p.reach || p.reachSpace !== REACH_SPACE) return base
  const r = p.reach
  const box = {
    minX: clamp(Math.min(r.minX, r.maxX), 0.03, 0.9),
    maxX: clamp(Math.max(r.minX, r.maxX), 0.1, 0.97),
    minY: clamp(Math.min(r.minY, r.maxY), 0.03, 0.9),
    maxY: clamp(Math.max(r.minY, r.maxY), 0.1, 0.97),
  }
  // Guard against a calibration where the child barely moved: an envelope
  // smaller than this cannot hold two targets.
  if (box.maxX - box.minX < 0.22 || box.maxY - box.minY < 0.22) return base
  if (s.seated) {
    box.minY = Math.max(box.minY, base.minY)
    box.maxY = Math.min(box.maxY, base.maxY)
  }
  return box
}

/**
 * Scales the envelope towards its centre — how much of the child's reach a
 * given difficulty level uses. `1` = the full calibrated box, `0.4` = a small
 * central region for a child who is still learning to reach at all.
 */
export function scaledReachBox(eccentricity = 1) {
  const b = reachBox()
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2
  const k = clamp(eccentricity, 0.2, 1)
  return {
    minX: cx - (cx - b.minX) * k,
    maxX: cx + (b.maxX - cx) * k,
    minY: cy - (cy - b.minY) * k,
    maxY: cy + (b.maxY - cy) * k,
  }
}

export function saveReachCalibration(box, meta = {}) {
  const p = loadProfile()
  p.reach = box
  p.reachSpace = REACH_SPACE
  p.reachCalibratedAt = new Date().toISOString()
  p.reachMeta = meta
  saveProfile(p)
  return p
}

export function isCalibrated() {
  const p = loadProfile()
  return Boolean(p.reach && p.reachSpace === REACH_SPACE)
}

// ── capability updates ───────────────────────────────────────────────────────
/**
 * Running average with a floor on the learning rate, so a profile keeps
 * tracking a child who is improving instead of freezing after 50 trials.
 */
export function updateCapability(name, sample, weight = 1) {
  if (!CAPABILITIES.includes(name) || !Number.isFinite(sample)) return
  const p = loadProfile()
  const est = p.capabilities[name] || emptyEstimate()
  const lr = Math.max(0.08, 1 / (est.n + 2)) * weight
  est.value = clamp(est.value + (clamp(sample, 0, 1) - est.value) * lr, 0, 1)
  est.n += 1
  p.capabilities[name] = est
  saveProfile(p)
}

export function recordHandUse(side) {
  if (side !== 'left' && side !== 'right') return
  const p = loadProfile()
  p.handUse[side] = (p.handUse[side] || 0) + 1
  const { left, right } = p.handUse
  const total = left + right
  // Only claim a dominant hand once there is enough evidence and a real split.
  if (total >= 20) {
    const ratio = Math.max(left, right) / total
    p.dominantHand = ratio >= 0.65 ? (left > right ? 'left' : 'right') : 'mixed'
  }
  saveProfile(p)
}

export function recordLatency(ms) {
  if (!Number.isFinite(ms) || ms <= 0 || ms > 20000) return
  const p = loadProfile()
  // Exponential median-ish tracker: robust to the odd 8-second distraction.
  p.latencyMs = p.latencyMs == null ? ms : Math.round(p.latencyMs * 0.85 + ms * 0.15)
  saveProfile(p)
}

/**
 * A response window derived from the child's own speed rather than a constant.
 * `factor` is how generous the game wants to be (2.5 = comfortable).
 * Returns 0 for "no limit".
 */
export function personalWindowMs(factor = 2.5, floor = 2500) {
  const p = loadProfile()
  const s = getSettings()
  const base = p.latencyMs ? p.latencyMs * factor : 6000
  return Math.round(Math.max(base, floor) * (s.extraTimeX || 1))
}

// ── per-game adaptive state ──────────────────────────────────────────────────
export function gameState(gameId) {
  const p = loadProfile()
  if (!p.games[gameId]) {
    p.games[gameId] = {
      levels: {}, // dimension -> index
      promptStage: 'A',
      dimCursor: 0,
      streak: 0,
      errors: 0,
      trials: 0,
      correct: 0,
      bestScore: 0,
      lastPlayedAt: null,
      history: [], // last 20 round summaries
    }
    saveProfile(p)
  }
  return p.games[gameId]
}

export function saveGameState(gameId, patch) {
  const p = loadProfile()
  p.games[gameId] = { ...gameState(gameId), ...patch }
  saveProfile(p)
  return p.games[gameId]
}

export function pushRoundHistory(gameId, summary) {
  const p = loadProfile()
  const st = gameState(gameId)
  // 30 rounds rather than 20: five levels of history per game needs the room,
  // and the per-game trend chart on the insights screen reads from here.
  st.history = [...(st.history || []), summary].slice(-30)
  st.lastPlayedAt = new Date().toISOString()
  st.bestScore = Math.max(st.bestScore || 0, summary.accuracyPct || 0)
  p.games[gameId] = st
  p.totals.sessions = (p.totals.sessions || 0) + 1
  saveProfile(p)
  return st
}

/** Snapshot for the therapist dashboard and for attaching to telemetry. */
export function profileSnapshot() {
  const p = loadProfile()
  return {
    key: p.key,
    dominantHand: p.dominantHand,
    handUse: p.handUse,
    latencyMs: p.latencyMs,
    reachCalibratedAt: p.reachCalibratedAt,
    reach: p.reach,
    capabilities: Object.fromEntries(
      Object.entries(p.capabilities).map(([k, v]) => [k, { value: Math.round(v.value * 100) / 100, n: v.n }])
    ),
    totals: p.totals,
    games: Object.fromEntries(
      Object.entries(p.games).map(([id, g]) => [
        id,
        {
          promptStage: g.promptStage,
          levels: g.levels,
          trials: g.trials,
          correct: g.correct,
          bestScore: g.bestScore,
          lastPlayedAt: g.lastPlayedAt,
        },
      ])
    ),
  }
}
