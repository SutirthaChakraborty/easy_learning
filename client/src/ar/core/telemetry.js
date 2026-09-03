/**
 * Trial-level telemetry.
 *
 * The single most important thing this file does is refuse to collapse a trial
 * into pass/fail. A child who touches the right answer after 3.2 s is recorded
 * as:
 *
 *   accuracy       = 'correct'
 *   latencyMs      = 1180        (prompt → movement onset: the decision)
 *   movementTimeMs = 2020        (movement onset → contact: the execution)
 *   pathEfficiency = 0.71
 *   promptLevel    = 'C'
 *
 * …not as `FAIL`. Cognitive accuracy and motor execution speed are separate
 * columns, everywhere, forever.
 *
 * Privacy: only landmark-derived numbers leave the device. No frame, no image,
 * no crop is ever captured, stored or uploaded — MediaPipe runs entirely
 * in-page and the video element is never read back. Uploads are gated on
 * `settings.telemetry`; when it is off, or when nobody is logged in, sessions
 * are still summarised locally so the child sees their own progress.
 */
import { authHeaders } from '../../utils/authHeaders'
import { median, stdev, iqr, clamp } from './geometry'
import { getSettings } from './settings'
import {
  profileSnapshot,
  pushRoundHistory,
  recordHandUse,
  recordLatency,
} from './profile'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const LOCAL_KEY = 'ar_sessions_v1'
const LOCAL_MAX = 60 // rolling window of sessions kept on-device

/** Outcome vocabulary — 'near' exists so slow-but-correct is never punished. */
export const OUTCOME = {
  CORRECT: 'correct',
  NEAR: 'near', // right answer, imprecise or late execution
  INCORRECT: 'incorrect',
  OMISSION: 'omission', // no response inside the window
  FALSE_ALARM: 'falseAlarm', // responded on a no-go trial
  CORRECT_INHIBIT: 'correctInhibit', // correctly withheld on a no-go trial
  ABORTED: 'aborted', // therapist skipped / paused out of the trial
}

const POSITIVE = new Set([OUTCOME.CORRECT, OUTCOME.CORRECT_INHIBIT])

let sessionSeq = 0

/**
 * @typedef {Object} Trial
 * @property {number} index
 * @property {string} accuracy one of OUTCOME
 * @property {string} promptLevel 'A'..'G'
 * @property {boolean} prompted did the child use the highlight/demo
 * @property {number|null} latencyMs prompt → movement onset (decision)
 * @property {number|null} movementTimeMs movement onset → contact (execution)
 * @property {number|null} pathEfficiency 0..1, 1 = perfectly direct
 * @property {string|null} hand 'left'|'right'
 */

export function startSession(meta) {
  const settings = getSettings()
  const startedAt = Date.now()
  const startPerf = performance.now()

  const session = {
    clientSessionId: `${startedAt.toString(36)}-${(sessionSeq++).toString(36)}-${Math.floor(
      (startedAt % 1e6) * 7919
    ).toString(36)}`,
    gameId: meta.gameId,
    engine: meta.engine,
    title: meta.title,
    domains: meta.domains || [],
    lifeSkill: meta.lifeSkill || null,
    group: meta.group || null,
    startedAt: new Date(startedAt).toISOString(),
    startPerf,
    endedAt: null,
    durationMs: 0,
    pausedMs: 0,
    pauseCount: 0,
    difficulty: meta.difficulty || {},
    promptStageStart: meta.promptStage || 'A',
    promptStageEnd: meta.promptStage || 'A',
    settingsSnapshot: {
      largeTargets: settings.largeTargets,
      extraTimeX: settings.extraTimeX,
      seated: settings.seated,
      singleHand: settings.singleHand,
      instruction: settings.instruction,
      dwellMs: settings.dwellMs,
      reducedMotion: settings.reducedMotion,
      promptMode: settings.promptMode,
      difficultyMode: settings.difficultyMode,
    },
    device: deviceInfo(),
    pipeline: meta.pipeline || null,
    trials: [],
    events: [], // pauses, difficulty steps, prompt changes, calibration
  }

  let pauseStartedAt = null

  const api = {
    session,

    /** Records one trial. Returns the stored object (with derived fields). */
    trial(t) {
      const entry = {
        index: session.trials.length,
        at: Math.round(performance.now() - startPerf),
        accuracy: t.accuracy || OUTCOME.INCORRECT,
        promptLevel: t.promptLevel ?? session.promptStageEnd,
        prompted: Boolean(t.prompted),
        // ── cognitive ──
        targetId: t.targetId ?? null,
        chosenId: t.chosenId ?? null,
        choices: t.choices ?? null,
        distractors: t.distractors ?? null,
        distractorKind: t.distractorKind ?? null,
        steps: t.steps ?? null,
        memorySpan: t.memorySpan ?? null,
        rule: t.rule ?? null,
        ruleSwitched: t.ruleSwitched ?? null,
        // ── motor, kept strictly separate ──
        latencyMs: numOrNull(t.latencyMs),
        movementTimeMs: numOrNull(t.movementTimeMs),
        totalMs: numOrNull(t.totalMs),
        pathEfficiency: numOrNull(t.pathEfficiency),
        peakSpeed: numOrNull(t.peakSpeed),
        reversals: numOrNull(t.reversals),
        contactErrorPx: numOrNull(t.contactErrorPx),
        contactError: numOrNull(t.contactError),
        targetRadius: numOrNull(t.targetRadius),
        hand: t.hand ?? null,
        crossedMidline: t.crossedMidline ?? null,
        bilateralOffsetMs: numOrNull(t.bilateralOffsetMs),
        usedBothHands: t.usedBothHands ?? null,
        // ── timing tasks ──
        timingErrorMs: numOrNull(t.timingErrorMs),
        // ── tracing tasks ──
        coverage: numOrNull(t.coverage),
        traceAccuracy: numOrNull(t.traceAccuracy),
        meanDeviation: numOrNull(t.meanDeviation),
        strayCount: numOrNull(t.strayCount),
        // ── posture tasks ──
        postureScore: numOrNull(t.postureScore),
        holdBreaks: numOrNull(t.holdBreaks),
        // ── bookkeeping ──
        // `stage` is set by the mission engine so a "My Day" run can be broken
        // back down into the sub-activities it chained together.
        stage: t.stage ?? null,
        timedOut: Boolean(t.timedOut),
        attempts: t.attempts ?? 1,
        windowMs: numOrNull(t.windowMs),
        pipelineLatencyMs: numOrNull(t.pipelineLatencyMs),
        note: t.note ?? null,
      }
      session.trials.push(entry)

      if (entry.hand) recordHandUse(entry.hand)
      // Only feed the personal-latency model from clean, correct decisions.
      if (entry.accuracy === OUTCOME.CORRECT && entry.latencyMs) recordLatency(entry.latencyMs)

      return entry
    },

    event(type, data = {}) {
      session.events.push({ type, at: Math.round(performance.now() - startPerf), ...data })
    },

    pauseStart() {
      if (pauseStartedAt != null) return
      pauseStartedAt = performance.now()
      session.pauseCount++
      api.event('pause')
    },

    pauseEnd() {
      if (pauseStartedAt == null) return
      session.pausedMs += performance.now() - pauseStartedAt
      pauseStartedAt = null
      api.event('resume')
    },

    setPromptStage(stage) {
      session.promptStageEnd = stage
    },

    setPipeline(report) {
      session.pipeline = report
    },

    /** Ends, summarises, persists locally and (if allowed) uploads. */
    async end(extra = {}) {
      if (pauseStartedAt != null) api.pauseEnd()
      session.endedAt = new Date().toISOString()
      session.durationMs = Math.round(performance.now() - startPerf)
      session.activeMs = Math.max(0, Math.round(session.durationMs - session.pausedMs))
      session.outcome = extra.outcome || 'completed'
      session.stars = extra.stars ?? null
      session.xp = extra.xp ?? null
      session.summary = summarise(session)
      session.profile = profileSnapshot()
      delete session.startPerf

      pushRoundHistory(session.gameId, {
        at: session.endedAt,
        accuracyPct: session.summary.accuracyPct,
        trials: session.summary.trials,
        medianLatencyMs: session.summary.medianLatencyMs,
        independentPct: session.summary.independentPct,
        promptStage: session.promptStageEnd,
        stars: session.stars,
      })

      persistLocal(session)
      void upload(session)
      return session
    },
  }

  return api
}

// ── summarisation ────────────────────────────────────────────────────────────
/**
 * Everything a therapist dashboard needs, computed once at session end.
 * Note what is *not* here: a single "score" that mixes accuracy and speed.
 */
export function summarise(session) {
  const trials = session.trials || []
  const answered = trials.filter((t) => t.accuracy !== OUTCOME.ABORTED)
  const goTrials = answered.filter(
    (t) => t.accuracy !== OUTCOME.CORRECT_INHIBIT && t.accuracy !== OUTCOME.FALSE_ALARM
  )
  const noGoTrials = answered.filter(
    (t) => t.accuracy === OUTCOME.CORRECT_INHIBIT || t.accuracy === OUTCOME.FALSE_ALARM
  )

  const correct = answered.filter((t) => POSITIVE.has(t.accuracy))
  const near = answered.filter((t) => t.accuracy === OUTCOME.NEAR)
  const omissions = answered.filter((t) => t.accuracy === OUTCOME.OMISSION)
  const falseAlarms = answered.filter((t) => t.accuracy === OUTCOME.FALSE_ALARM)

  const latencies = answered.map((t) => t.latencyMs).filter(Number.isFinite)
  const moveTimes = answered.map((t) => t.movementTimeMs).filter(Number.isFinite)
  const effs = answered.map((t) => t.pathEfficiency).filter(Number.isFinite)
  const timings = answered.map((t) => t.timingErrorMs).filter(Number.isFinite)

  const byHand = (side) => {
    const set = goTrials.filter((t) => t.hand === side)
    return set.length
      ? {
          trials: set.length,
          accuracyPct: pct(set.filter((t) => POSITIVE.has(t.accuracy)).length, set.length),
          medianLatencyMs: median(set.map((t) => t.latencyMs)),
          medianMovementMs: median(set.map((t) => t.movementTimeMs)),
          pathEfficiency: round(mean(set.map((t) => t.pathEfficiency)), 3),
        }
      : null
  }

  const byPrompt = {}
  for (const t of answered) {
    const k = t.promptLevel || '?'
    byPrompt[k] = byPrompt[k] || { trials: 0, correct: 0 }
    byPrompt[k].trials++
    if (POSITIVE.has(t.accuracy)) byPrompt[k].correct++
  }
  for (const k of Object.keys(byPrompt)) {
    byPrompt[k].accuracyPct = pct(byPrompt[k].correct, byPrompt[k].trials)
  }

  const bySteps = {}
  for (const t of answered.filter((x) => Number.isFinite(x.steps))) {
    const k = String(t.steps)
    bySteps[k] = bySteps[k] || { trials: 0, correct: 0 }
    bySteps[k].trials++
    if (POSITIVE.has(t.accuracy)) bySteps[k].correct++
  }
  for (const k of Object.keys(bySteps)) bySteps[k].accuracyPct = pct(bySteps[k].correct, bySteps[k].trials)

  const independent = answered.filter((t) => POSITIVE.has(t.accuracy) && !t.prompted)

  return {
    trials: answered.length,
    correct: correct.length,
    near: near.length,
    omissions: omissions.length,
    accuracyPct: pct(correct.length, answered.length),
    // "Got the idea" — correct plus right-answer-executed-imprecisely. This is
    // the number that reflects understanding.
    comprehensionPct: pct(correct.length + near.length, answered.length),
    independentPct: pct(independent.length, answered.length),
    promptedPct: pct(answered.filter((t) => t.prompted).length, answered.length),

    // Motor execution, reported separately and never folded into accuracy.
    medianLatencyMs: round(median(latencies)),
    latencyIqrMs: round(iqr(latencies)),
    medianMovementMs: round(median(moveTimes)),
    movementSdMs: round(stdev(moveTimes)),
    pathEfficiency: round(mean(effs), 3),

    // Inhibition
    noGoTrials: noGoTrials.length,
    falseAlarms: falseAlarms.length,
    falseAlarmPct: noGoTrials.length ? pct(falseAlarms.length, noGoTrials.length) : null,
    inhibitionPct: noGoTrials.length
      ? pct(noGoTrials.filter((t) => t.accuracy === OUTCOME.CORRECT_INHIBIT).length, noGoTrials.length)
      : null,

    // Timing (rhythm tasks): signed median error + variability. Variability is
    // the more meaningful of the two — a consistent lag is just an offset.
    medianTimingErrorMs: round(median(timings)),
    timingVariabilityMs: round(stdev(timings)),
    timingHitPct: timings.length
      ? pct(timings.filter((ms) => Math.abs(ms) <= 180).length, timings.length)
      : null,

    byHand: { left: byHand('left'), right: byHand('right') },
    byPromptLevel: byPrompt,
    byInstructionSteps: bySteps,

    crossMidlineTrials: answered.filter((t) => t.crossedMidline === true).length,
    crossMidlineAccuracyPct: (() => {
      const set = answered.filter((t) => t.crossedMidline === true)
      return set.length ? pct(set.filter((t) => POSITIVE.has(t.accuracy)).length, set.length) : null
    })(),
    bilateralOffsetMs: round(median(answered.map((t) => t.bilateralOffsetMs))),

    coverage: round(mean(answered.map((t) => t.coverage)), 3),
    traceAccuracy: round(mean(answered.map((t) => t.traceAccuracy)), 3),
    postureScore: round(mean(answered.map((t) => t.postureScore)), 3),

    pauseCount: session.pauseCount,
    pausedMs: Math.round(session.pausedMs),
    difficultySteps: (session.events || []).filter((e) => e.type === 'difficultyStep').length,
  }
}

const mean = (a) => {
  const v = a.filter(Number.isFinite)
  return v.length ? v.reduce((s, n) => s + n, 0) / v.length : null
}
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const round = (v, dp = 0) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp)
const numOrNull = (v) => (Number.isFinite(v) ? Math.round(v * 10000) / 10000 : null)

function deviceInfo() {
  const nav = typeof navigator === 'undefined' ? {} : navigator
  return {
    // Coarse only — enough to interpret latency numbers, not to fingerprint.
    cores: nav.hardwareConcurrency || null,
    memoryGb: nav.deviceMemory || nav.deviceMemory === 0 ? nav.deviceMemory : null,
    touch: typeof window !== 'undefined' ? window.matchMedia?.('(pointer: coarse)').matches : null,
    viewport:
      typeof window !== 'undefined'
        ? `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`
        : null,
    platform: nav.platform || null,
  }
}

// ── persistence ──────────────────────────────────────────────────────────────
function persistLocal(session) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.push({ ...session, uploaded: false })
    while (list.length > LOCAL_MAX) list.shift()
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    // Quota exceeded: drop the oldest half and retry once.
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      const list = raw ? JSON.parse(raw) : []
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-10).concat([session])))
    } catch {
      /* give up quietly — the session summary is still returned to the caller */
    }
  }
}

function markUploaded(ids) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return
    const list = JSON.parse(raw)
    const set = new Set(ids)
    for (const s of list) if (set.has(s.clientSessionId)) s.uploaded = true
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function localSessions() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearLocalSessions() {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    /* ignore */
  }
}

function loggedIn() {
  return Boolean(localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt'))
}

async function upload(session) {
  if (!getSettings().telemetry) return { skipped: 'telemetry-off' }
  if (!loggedIn()) return { skipped: 'anonymous' }
  try {
    const res = await fetch(`${API}/ar/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ session: stripForUpload(session) }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    markUploaded([session.clientSessionId])
    return { ok: true }
  } catch (err) {
    // Offline / server down: it stays in the local ring buffer and
    // `flushPendingSessions()` retries on the next hub visit.
    console.warn('[ar] session upload deferred:', err?.message || err)
    return { deferred: true }
  }
}

function stripForUpload(session) {
  const { profile, ...rest } = session
  return {
    ...rest,
    // The full capability profile is uploaded once per session, not per trial.
    profile: profile
      ? { dominantHand: profile.dominantHand, latencyMs: profile.latencyMs, capabilities: profile.capabilities }
      : null,
  }
}

/** Retries anything the network ate. Called from the AR hub on mount. */
export async function flushPendingSessions() {
  if (!getSettings().telemetry || !loggedIn()) return { sent: 0 }
  const list = localSessions().filter((s) => !s.uploaded)
  if (!list.length) return { sent: 0 }
  try {
    const res = await fetch(`${API}/ar/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ sessions: list.slice(-25).map(stripForUpload) }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    markUploaded(list.map((s) => s.clientSessionId))
    return { sent: list.length }
  } catch {
    return { sent: 0, deferred: true }
  }
}

/**
 * Aggregates the on-device history into the numbers the insights screen shows.
 * Runs locally so the screen works offline and for anonymous play.
 */
export function aggregateLocal(sessions = localSessions()) {
  if (!sessions.length) return null
  const all = sessions.flatMap((s) => s.trials || [])
  const answered = all.filter((t) => t.accuracy !== OUTCOME.ABORTED)
  const perGame = {}
  for (const s of sessions) {
    const g = (perGame[s.gameId] = perGame[s.gameId] || {
      gameId: s.gameId,
      title: s.title,
      group: s.group,
      domains: s.domains,
      sessions: 0,
      trials: 0,
      correct: 0,
      independent: 0,
      latencies: [],
      history: [],
    })
    g.sessions++
    for (const t of s.trials || []) {
      if (t.accuracy === OUTCOME.ABORTED) continue
      g.trials++
      if (POSITIVE.has(t.accuracy)) g.correct++
      if (POSITIVE.has(t.accuracy) && !t.prompted) g.independent++
      if (Number.isFinite(t.latencyMs)) g.latencies.push(t.latencyMs)
    }
    g.history.push({
      at: s.endedAt || s.startedAt,
      accuracyPct: s.summary?.accuracyPct ?? null,
      independentPct: s.summary?.independentPct ?? null,
      promptStage: s.promptStageEnd,
    })
  }

  const domainTally = {}
  for (const s of sessions) {
    for (const d of s.domains || []) {
      const t = (domainTally[d] = domainTally[d] || { trials: 0, correct: 0 })
      for (const tr of s.trials || []) {
        if (tr.accuracy === OUTCOME.ABORTED) continue
        t.trials++
        if (POSITIVE.has(tr.accuracy)) t.correct++
      }
    }
  }

  return {
    sessions: sessions.length,
    totalTrials: answered.length,
    accuracyPct: pct(answered.filter((t) => POSITIVE.has(t.accuracy)).length, answered.length),
    comprehensionPct: pct(
      answered.filter((t) => POSITIVE.has(t.accuracy) || t.accuracy === OUTCOME.NEAR).length,
      answered.length
    ),
    independentPct: pct(
      answered.filter((t) => POSITIVE.has(t.accuracy) && !t.prompted).length,
      answered.length
    ),
    medianLatencyMs: round(median(answered.map((t) => t.latencyMs))),
    medianMovementMs: round(median(answered.map((t) => t.movementTimeMs))),
    pathEfficiency: round(mean(answered.map((t) => t.pathEfficiency)), 3),
    minutesPlayed: Math.round(sessions.reduce((s, x) => s + (x.activeMs || 0), 0) / 60000),
    byHand: {
      left: handSlice(answered, 'left'),
      right: handSlice(answered, 'right'),
    },
    byDomain: Object.fromEntries(
      Object.entries(domainTally).map(([k, v]) => [k, { ...v, accuracyPct: pct(v.correct, v.trials) }])
    ),
    games: Object.values(perGame)
      .map((g) => ({
        ...g,
        accuracyPct: pct(g.correct, g.trials),
        independentPct: pct(g.independent, g.trials),
        medianLatencyMs: round(median(g.latencies)),
        latencies: undefined,
      }))
      .sort((a, b) => b.sessions - a.sessions),
    lastPlayedAt: sessions[sessions.length - 1]?.endedAt || null,
  }
}

function handSlice(trials, side) {
  const set = trials.filter((t) => t.hand === side)
  if (!set.length) return null
  return {
    trials: set.length,
    accuracyPct: pct(set.filter((t) => POSITIVE.has(t.accuracy)).length, set.length),
    medianLatencyMs: round(median(set.map((t) => t.latencyMs))),
    pathEfficiency: round(mean(set.map((t) => t.pathEfficiency)), 3),
  }
}

/**
 * Star rating. Weighted so understanding dominates and speed contributes only
 * a little — a slow, accurate, independent child should still earn 3 stars.
 */
export function starsFor(summary) {
  if (!summary || !summary.trials) return 0
  const comprehension = (summary.comprehensionPct ?? 0) / 100
  const independence = (summary.independentPct ?? 0) / 100
  const score = comprehension * 0.75 + independence * 0.25
  return score >= 0.82 ? 3 : score >= 0.6 ? 2 : score >= 0.3 ? 1 : 0
}

export function xpFor(summary, stars) {
  const base = clamp((summary?.trials || 0) * 2, 0, 40)
  return Math.round(base + stars * 10)
}

if (typeof window !== 'undefined') {
  // Last-ditch flush when the tab closes mid-session.
  window.addEventListener('pagehide', () => {
    if (!getSettings().telemetry || !loggedIn()) return
    const pending = localSessions().filter((s) => !s.uploaded)
    if (!pending.length || !navigator.sendBeacon) return
    try {
      const blob = new Blob(
        [JSON.stringify({ sessions: pending.slice(-10).map(stripForUpload), beacon: true })],
        { type: 'application/json' }
      )
      // sendBeacon cannot carry an Authorization header; the endpoint also
      // accepts the httpOnly session cookie set at login.
      navigator.sendBeacon(`${API}/ar/sessions`, blob)
    } catch {
      /* ignore */
    }
  })
}
