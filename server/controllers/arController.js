const mongoose = require('mongoose')
const ARSession       = require('../models/ARSession')
const StudentActivity = require('../models/StudentActivity')
const StudentRound    = require('../models/StudentRound')

// ── Limits ─────────────────────────────────────────────────────────────────────
const MAX_TRIALS      = 400 // a round is minutes long; more than this is a bug or an attack
const MAX_EVENTS      = 400
const MAX_BATCH       = 25  // matches the client's flushPendingSessions() slice
const MAX_LIST_LIMIT  = 200
const MAX_INSIGHT_DAYS = 365

// Must stay in step with the `accuracy` enum on the trial sub-schema.
const OUTCOMES = ['correct', 'near', 'incorrect', 'omission', 'falseAlarm', 'correctInhibit', 'aborted']

// ── Helpers ────────────────────────────────────────────────────────────────────
// Same day-bucketing as dashboardController.js so AR rounds land in the very
// same StudentActivity documents as the rest of the child's learning.
function midnight(d = new Date()) {
  const dt = new Date(d)
  dt.setUTCHours(0, 0, 0, 0)
  return dt
}

// StudentActivity stores email lowercased, so normalise once and use the same
// value for both the AR tables and the mirrored dashboard rows.
function callerEmail(req) {
  return String(req.user?.email || '').trim().toLowerCase()
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const int = (v) => (num(v) == null ? 0 : Math.round(v))
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const round = (v, dp = 0) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp)

function toDate(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Accepts an ISO string or epoch ms — the insights UI may send either. */
function parseSince(raw) {
  if (raw == null || raw === '') return null
  const asMs = Number(raw)
  const d = Number.isFinite(asMs) && String(raw).trim() !== '' ? new Date(asMs) : new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function median(values) {
  const v = values.filter((n) => typeof n === 'number' && Number.isFinite(n)).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/** @returns {string|null} a human message when the payload is unusable. */
function validateSession(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'session object is required'
  if (!str(raw.gameId)) return 'session.gameId is required'
  if (raw.trials != null && !Array.isArray(raw.trials)) return 'session.trials must be an array'
  if (Array.isArray(raw.trials) && raw.trials.length > MAX_TRIALS) {
    return `session.trials must hold at most ${MAX_TRIALS} entries`
  }
  return null
}

/**
 * One unknown outcome string must not void a whole round of data, so the enum
 * is coerced here rather than left to blow up model validation.
 */
function normaliseTrial(raw, i) {
  const t = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {}
  if (!OUTCOMES.includes(t.accuracy)) t.accuracy = 'incorrect'
  if (t.hand !== 'left' && t.hand !== 'right') t.hand = null
  if (typeof t.index !== 'number') t.index = i
  return t
}

function buildSessionDoc(email, raw) {
  const trials = Array.isArray(raw.trials) ? raw.trials.slice(0, MAX_TRIALS).map(normaliseTrial) : []
  const durationMs = int(raw.durationMs)
  return {
    email,
    // Fall back to something deterministic so a client that failed to mint an
    // id still upserts instead of duplicating on every retry.
    clientSessionId: str(raw.clientSessionId) || `${str(raw.gameId)}-${raw.startedAt || 'unknown'}`,
    gameId:    str(raw.gameId),
    engine:    str(raw.engine),
    title:     str(raw.title),
    group:     str(raw.group),
    domains:   Array.isArray(raw.domains) ? raw.domains.filter((d) => typeof d === 'string') : [],
    lifeSkill: str(raw.lifeSkill),
    startedAt: toDate(raw.startedAt) || new Date(),
    endedAt:   toDate(raw.endedAt),
    durationMs,
    activeMs:   num(raw.activeMs) == null ? durationMs : int(raw.activeMs),
    pausedMs:   int(raw.pausedMs),
    pauseCount: int(raw.pauseCount),
    promptStageStart: str(raw.promptStageStart),
    promptStageEnd:   str(raw.promptStageEnd),
    difficulty:       raw.difficulty ?? null,
    settingsSnapshot: raw.settingsSnapshot ?? null,
    device:           raw.device ?? null,
    pipeline:         raw.pipeline ?? null,
    outcome: str(raw.outcome) || 'completed',
    stars:   num(raw.stars),
    xp:      num(raw.xp),
    summary: raw.summary && typeof raw.summary === 'object' && !Array.isArray(raw.summary) ? raw.summary : {},
    profile: raw.profile ?? null,
    trials,
    events: Array.isArray(raw.events) ? raw.events.slice(-MAX_EVENTS) : [],
  }
}

/**
 * Mirrors one AR round into the ordinary dashboard tables so an AR game shows
 * up in the child's streak, XP and minutes exactly like a reading lesson does.
 * Only ever called for a genuinely new session — a retried upload must not
 * award the same XP twice.
 */
async function mirrorToDashboard(email, doc) {
  await StudentRound.create({
    email,
    module:  `ar:${doc.gameId}`,
    subject: 'general',
    mode:    'practice',
    stars:      doc.stars || 0,
    bonusStars: 0,
    totalStars: doc.stars || 0,
    passed:     null,
  })

  const start = doc.startedAt || new Date()
  const end   = doc.endedAt || new Date()
  // A 40-second round is still a session: never round a played round to 0.
  const durationMinutes = Math.max(1, Math.round((doc.activeMs || 0) / 60000))
  const xpEarned = doc.xp || 0

  await StudentActivity.findOneAndUpdate(
    { email, date: midnight(end) },
    {
      $push: {
        sessions: {
          startTime: start,
          endTime: end,
          durationMinutes,
          module: 'ar',
          subject: 'general',
          xpEarned,
          score: num(doc.summary?.accuracyPct) || 0,
        },
      },
      $inc: {
        totalMinutes: durationMinutes,
        totalXP: xpEarned,
        totalSessions: 1,
      },
    },
    { upsert: true, new: true }
  )
}

/** Upserts one session and mirrors it if it is new. @returns the stored doc. */
async function saveSession(email, raw) {
  const doc = buildSessionDoc(email, raw)
  const existing = await ARSession.exists({ email, clientSessionId: doc.clientSessionId })

  const saved = await ARSession.findOneAndUpdate(
    { email, clientSessionId: doc.clientSessionId },
    { $set: doc },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  )

  if (!existing) {
    // Telemetry is the source of truth; a failed mirror must not lose the round.
    try {
      await mirrorToDashboard(email, doc)
    } catch (err) {
      console.error('AR mirrorToDashboard error:', err)
    }
  }

  return saved
}

// ── Controllers ────────────────────────────────────────────────────────────────

const logSession = async (req, res) => {
  try {
    const email = callerEmail(req)
    const raw = req.body?.session

    const problem = validateSession(raw)
    if (problem) return res.status(400).json({ success: false, message: problem })

    const saved = await saveSession(email, raw)
    res.json({
      success: true,
      data: { id: saved._id, clientSessionId: saved.clientSessionId, trials: saved.trials.length },
    })
  } catch (err) {
    console.error('logSession error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * Batch/retry endpoint. Also the sendBeacon target on pagehide, so it has to be
 * forgiving: one malformed round out of ten must not cost the other nine.
 */
const logSessions = async (req, res) => {
  try {
    const email = callerEmail(req)
    const list = req.body?.sessions

    if (!Array.isArray(list)) {
      return res.status(400).json({ success: false, message: 'sessions must be an array' })
    }
    if (list.length > MAX_BATCH) {
      return res.status(400).json({ success: false, message: `at most ${MAX_BATCH} sessions per request` })
    }

    let saved = 0
    let skipped = 0
    const errors = []

    for (const raw of list) {
      const problem = validateSession(raw)
      if (problem) {
        skipped++
        errors.push({ clientSessionId: raw?.clientSessionId || null, message: problem })
        continue
      }
      try {
        await saveSession(email, raw)
        saved++
      } catch (err) {
        skipped++
        errors.push({ clientSessionId: raw?.clientSessionId || null, message: err.message })
        console.error('logSessions entry error:', err)
      }
    }

    res.json({ success: true, saved, skipped, errors })
  } catch (err) {
    console.error('logSessions error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getSessions = async (req, res) => {
  try {
    const email = callerEmail(req)
    const limit = Math.min(parseInt(req.query.limit) || 50, MAX_LIST_LIMIT)
    const query = { email }
    if (str(req.query.gameId)) query.gameId = str(req.query.gameId)
    const since = parseSince(req.query.since)
    if (since) query.startedAt = { $gte: since }

    // Trials are the bulk of a document and no list view needs them; the
    // summary carries everything the history screen shows.
    const sessions = await ARSession.find(query)
      .select('-trials -events')
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean()

    res.json({ success: true, data: sessions })
  } catch (err) {
    console.error('getSessions error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getSession = async (req, res) => {
  try {
    const email = callerEmail(req)
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id' })
    }

    // The email filter is the authorisation check: never serve another child's round.
    const session = await ARSession.findOne({ _id: id, email }).lean()
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' })

    res.json({ success: true, data: session })
  } catch (err) {
    console.error('getSession error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * The therapist / parent view.
 *
 * Percentages are trial-weighted (a 30-trial round counts for more than a
 * 4-trial one) and latency is a median of the per-session medians. The heavy
 * lifting is deliberately done in JS from the session summaries: a child plays
 * tens of rounds, not millions, and this stays portable across Mongo versions
 * (no $percentile, no $median). Only the domain roll-up needs the database,
 * because `domains` is an array field that has to be unwound.
 */
const getInsights = async (req, res) => {
  try {
    const email = callerEmail(req)
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), MAX_INSIGHT_DAYS)
    const since = new Date()
    since.setDate(since.getDate() - days)

    const rows = await ARSession.find({ email, startedAt: { $gte: since } })
      .select('gameId title group domains lifeSkill promptStageEnd startedAt endedAt activeMs stars xp summary')
      .sort({ startedAt: 1 })
      .lean()

    const perDomainRaw = await ARSession.aggregate([
      { $match: { email, startedAt: { $gte: since } } },
      { $unwind: '$domains' },
      {
        $group: {
          _id: '$domains',
          trials:  { $sum: { $ifNull: ['$summary.trials', 0] } },
          correct: { $sum: { $ifNull: ['$summary.correct', 0] } },
        },
      },
      { $sort: { trials: -1, _id: 1 } },
    ])

    const perDomain = perDomainRaw.map((d) => ({
      domain: d._id,
      trials: d.trials,
      accuracyPct: pct(d.correct, d.trials),
    }))

    // ── overall ──
    let trials = 0
    let correct = 0
    let comprehended = 0
    let independent = 0
    let activeMs = 0
    let effWeight = 0
    let effSum = 0
    const latencyMedians = []

    for (const r of rows) {
      const s = r.summary || {}
      const n = num(s.trials) || 0
      trials += n
      correct += num(s.correct) || 0
      comprehended += (num(s.correct) || 0) + (num(s.near) || 0)
      // Only the percentage is stored per session, so weight it back up by
      // trial count to keep the overall figure trial-weighted.
      if (num(s.independentPct) != null) independent += (s.independentPct / 100) * n
      activeMs += num(r.activeMs) || 0
      if (num(s.medianLatencyMs) != null) latencyMedians.push(s.medianLatencyMs)
      if (num(s.pathEfficiency) != null && n) {
        effSum += s.pathEfficiency * n
        effWeight += n
      }
    }

    const overall = {
      sessions: rows.length,
      trials,
      accuracyPct: pct(correct, trials),
      comprehensionPct: pct(comprehended, trials),
      independentPct: pct(independent, trials),
      medianLatencyMs: round(median(latencyMedians)),
      pathEfficiency: round(effWeight ? effSum / effWeight : null, 3),
      minutesPlayed: Math.round(activeMs / 60000),
    }

    // ── per game ──
    const games = new Map()
    for (const r of rows) {
      const s = r.summary || {}
      const n = num(s.trials) || 0
      let g = games.get(r.gameId)
      if (!g) {
        g = {
          gameId: r.gameId,
          title: r.title || r.gameId,
          sessions: 0,
          trials: 0,
          correct: 0,
          independent: 0,
          latencies: [],
          lastPlayedAt: null,
          promptStage: null,
        }
        games.set(r.gameId, g)
      }
      g.sessions++
      g.trials += n
      g.correct += num(s.correct) || 0
      if (num(s.independentPct) != null) g.independent += (s.independentPct / 100) * n
      if (num(s.medianLatencyMs) != null) g.latencies.push(s.medianLatencyMs)
      if (r.title) g.title = r.title
      // rows are ascending, so the last one seen is the most recent round.
      g.lastPlayedAt = r.endedAt || r.startedAt || g.lastPlayedAt
      g.promptStage = r.promptStageEnd || g.promptStage
    }

    const perGame = [...games.values()]
      .map((g) => ({
        gameId: g.gameId,
        title: g.title,
        sessions: g.sessions,
        trials: g.trials,
        accuracyPct: pct(g.correct, g.trials),
        independentPct: pct(g.independent, g.trials),
        medianLatencyMs: round(median(g.latencies)),
        lastPlayedAt: g.lastPlayedAt,
        promptStage: g.promptStage,
      }))
      .sort((a, b) => b.sessions - a.sessions)

    // ── by hand ──
    const handTally = {
      left:  { trials: 0, correct: 0, latencies: [], effSum: 0, effWeight: 0 },
      right: { trials: 0, correct: 0, latencies: [], effSum: 0, effWeight: 0 },
    }
    for (const r of rows) {
      for (const side of ['left', 'right']) {
        const h = r.summary?.byHand?.[side]
        if (!h || !num(h.trials)) continue
        const t = handTally[side]
        t.trials += h.trials
        if (num(h.accuracyPct) != null) t.correct += (h.accuracyPct / 100) * h.trials
        if (num(h.medianLatencyMs) != null) t.latencies.push(h.medianLatencyMs)
        if (num(h.pathEfficiency) != null) {
          t.effSum += h.pathEfficiency * h.trials
          t.effWeight += h.trials
        }
      }
    }
    const handSlice = (t) =>
      t.trials
        ? {
            trials: t.trials,
            accuracyPct: pct(t.correct, t.trials),
            medianLatencyMs: round(median(t.latencies)),
            pathEfficiency: round(t.effWeight ? t.effSum / t.effWeight : null, 3),
          }
        : null
    const byHand = { left: handSlice(handTally.left), right: handSlice(handTally.right) }

    // ── by prompt level (the prompt-fading ladder: A is most support) ──
    const promptTally = {}
    for (const r of rows) {
      const levels = r.summary?.byPromptLevel
      if (!levels || typeof levels !== 'object') continue
      for (const [level, v] of Object.entries(levels)) {
        if (!v || typeof v !== 'object') continue
        const p = (promptTally[level] = promptTally[level] || { trials: 0, correct: 0 })
        p.trials += num(v.trials) || 0
        p.correct += num(v.correct) != null
          ? v.correct
          : (num(v.accuracyPct) || 0) / 100 * (num(v.trials) || 0)
      }
    }
    const byPromptLevel = {}
    for (const level of Object.keys(promptTally).sort()) {
      const p = promptTally[level]
      byPromptLevel[level] = { trials: p.trials, accuracyPct: pct(p.correct, p.trials) }
    }

    // ── progression, one row per played day ──
    const dayTally = new Map()
    for (const r of rows) {
      const key = midnight(r.startedAt).toISOString().slice(0, 10)
      let d = dayTally.get(key)
      if (!d) {
        d = { date: key, trials: 0, correct: 0, independent: 0, sessions: 0 }
        dayTally.set(key, d)
      }
      const s = r.summary || {}
      const n = num(s.trials) || 0
      d.sessions++
      d.trials += n
      d.correct += num(s.correct) || 0
      if (num(s.independentPct) != null) d.independent += (s.independentPct / 100) * n
    }
    const progression = [...dayTally.values()]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((d) => ({
        date: d.date,
        accuracyPct: pct(d.correct, d.trials),
        independentPct: pct(d.independent, d.trials),
        sessions: d.sessions,
      }))

    // ── life skills (dressing, teeth, road safety …) ──
    const skillTally = new Map()
    for (const r of rows) {
      if (!r.lifeSkill) continue
      let k = skillTally.get(r.lifeSkill)
      if (!k) {
        k = { lifeSkill: r.lifeSkill, sessions: 0, trials: 0, independent: 0 }
        skillTally.set(r.lifeSkill, k)
      }
      const s = r.summary || {}
      const n = num(s.trials) || 0
      k.sessions++
      k.trials += n
      if (num(s.independentPct) != null) k.independent += (s.independentPct / 100) * n
    }
    const lifeSkills = [...skillTally.values()]
      .map((k) => ({
        lifeSkill: k.lifeSkill,
        sessions: k.sessions,
        independentPct: pct(k.independent, k.trials),
      }))
      .sort((a, b) => b.sessions - a.sessions)

    res.json({
      success: true,
      data: { days, since, overall, perGame, perDomain, byHand, byPromptLevel, progression, lifeSkills },
    })
  } catch (err) {
    console.error('getInsights error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * Data protection: a guardian can withdraw the child's AR data outright. That
 * has to take the mirrored dashboard rows with it, otherwise the numbers live
 * on in the progress screens after the telemetry is gone.
 */
const deleteMySessions = async (req, res) => {
  try {
    const email = callerEmail(req)

    const { deletedCount } = await ARSession.deleteMany({ email })
    const rounds = await StudentRound.deleteMany({ email, module: { $regex: '^ar:' } })

    let activitySessions = 0
    const days = await StudentActivity.find({ email, 'sessions.module': 'ar' })
    for (const day of days) {
      const arOnes = day.sessions.filter((s) => s.module === 'ar')
      if (!arOnes.length) continue
      const minutes = arOnes.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
      const xp      = arOnes.reduce((sum, s) => sum + (s.xpEarned || 0), 0)
      await StudentActivity.updateOne(
        { _id: day._id },
        {
          $pull: { sessions: { module: 'ar' } },
          $inc: { totalMinutes: -minutes, totalXP: -xp, totalSessions: -arOnes.length },
        }
      )
      activitySessions += arOnes.length
    }

    res.json({
      success: true,
      deleted: deletedCount || 0,
      mirrored: { rounds: rounds.deletedCount || 0, activitySessions },
    })
  } catch (err) {
    console.error('deleteMySessions error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { logSession, logSessions, getSessions, getSession, getInsights, deleteMySessions }
