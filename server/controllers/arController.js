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
const MAX_POINT_ROWS   = 16  // a points breakdown is a handful of rows; more is a bug
const MAX_JOURNEY_GAMES = 200 // the catalogue is ~70 games, so this can only ever be a runaway
const MAX_JOURNEY_DAYS  = 400 // matches the client's own `days` ring buffer in journey.js

/**
 * Ceilings on the numbers a round may claim for itself, in the same spirit as
 * MAX_TRIALS: a value above these is a bug or an attack, not a round.
 *
 * The real ceiling from `pointsFor()` in journey.js is about 300 — 58 for turns
 * played plus 60 for quality, times the level-5 multiplier of 1.8, plus 30 for a
 * personal best, 40 for a first clear and 15 for the first game of the day. 400
 * leaves the client room to retune without a server change while still keeping a
 * forged upload out of the shared XP economy the dashboard runs on. Negatives are
 * clamped to 0 for the same reason: `$inc` would otherwise take XP away.
 */
const MAX_ROUND_POINTS = 400
const MAX_ROUND_STARS  = 3

// The five visible journey levels. Must stay in step with LEVELS in
// client/src/ar/core/journey.js: levels are clamped to it both on the way in
// and on the way back out.
const LEVELS = 5

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

// A journey level, or null for the calibration tasks that have no journey. Kept
// separate from int() because 0 is not a level: a round with no level must stay
// null rather than becoming a level the child never played.
const lvl = (v) => (num(v) == null ? null : Math.min(Math.max(int(v), 1), LEVELS))
// Tri-state on purpose: false ("played it, did not clear") and null ("no journey
// on this game") are different facts and the clinical view reads them apart.
const bool = (v) => (typeof v === 'boolean' ? v : null)
// A count that is credited to a shared total, so it is bounded and never
// negative — see MAX_ROUND_POINTS.
const credit = (v, max) => (num(v) == null ? null : Math.min(Math.max(int(v), 0), max))

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
    // Bounded: these two are the only fields on a round that are $inc'd into the
    // dashboard totals shared with every other module, so an upload cannot be
    // allowed to name its own number.
    stars:   credit(raw.stars, MAX_ROUND_STARS),
    xp:      credit(raw.xp, MAX_ROUND_POINTS),
    // ── the journey verdict for this round (see the model for what each means) ──
    // Carried through verbatim rather than recomputed: the level envelope, the
    // clear bars and the points table live client-side in journey.js, and a
    // second implementation here would be a second answer to disagree with.
    level:           lvl(raw.level),
    levelCleared:    bool(raw.levelCleared),
    clearedBy:       str(raw.clearedBy),
    newBest:         bool(raw.newBest),
    pointsAwarded:   credit(raw.pointsAwarded, MAX_ROUND_POINTS),
    // Sliced for the same reason trials and events are: this is user-supplied
    // and the child was only ever shown a few rows of it.
    pointsBreakdown: Array.isArray(raw.pointsBreakdown)
      ? raw.pointsBreakdown.slice(0, MAX_POINT_ROWS).filter((r) => r && typeof r === 'object')
      : null,
    journeyPoints:   num(raw.journeyPoints),
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
 *
 * Two consequences of `doc.xp` now carrying real journey points — it used to
 * arrive null, because the client stamped stars and xp on the session *after*
 * firing the upload, so every AR round credited zero XP:
 *
 *  1. The "is this session new" guard in saveSession() became load-bearing. It
 *     is now decided by the upsert itself rather than by a preceding read.
 *
 *  2. Journey points are on a different scale from the XP the rest of the app
 *     awards. A strong level-5 round earns around 300 points, where the module's
 *     own xpFor() never exceeded 70 — so crediting points directly would make an
 *     AR round worth four ordinary lessons and quietly reshape a shared economy
 *     that nothing else in the app opted into. They are therefore scaled into
 *     the band the dashboard already understands. Points stay the child's
 *     currency and are reported unscaled everywhere in the AR section; XP stays
 *     the app's, and one round of anything is worth about one round of anything.
 */
const AR_XP_DIVISOR = 4 // ~300 journey points → ~75 XP, the old xpFor() ceiling

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
  // A played round is worth at least 1 XP, for the same reason it is worth at
  // least a minute: it happened.
  const xpEarned = doc.xp ? Math.max(1, Math.round(doc.xp / AR_XP_DIVISOR)) : 0

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

  // "Was this an insert?" is answered by the upsert itself rather than by a
  // preceding exists() check. The client retries the same clientSessionId from
  // its ring buffer and also beacons on pagehide, so two uploads of one round
  // can be in flight at once; with a separate read both would see "not there
  // yet" and both would mirror, crediting the round's XP twice. The unique
  // index on { email, clientSessionId } makes the write itself the only place
  // that can truthfully say which call created the document.
  const result = await ARSession.findOneAndUpdate(
    { email, clientSessionId: doc.clientSessionId },
    { $set: doc },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
      includeResultMetadata: true,
    }
  )
  const saved = result.value
  const inserted = result.lastErrorObject?.upserted != null

  if (inserted) {
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
 * The journey as the server has it, for the client's `mergeRemoteJourney()`.
 *
 * This is the restore path: a child who picks up a different device — a
 * sibling's tablet, the clinic's — has to get their levels and their points
 * back, and the hub asks for this on every visit. So it stays cheap three ways:
 * one indexed $match on the child, one $facet so all three answers come back in
 * a single round trip, and a set of field dependencies that excludes `trials`,
 * which is where a session document's bulk lives. It returns exactly the shape
 * the client merges — anything broader would only be thrown away on the device.
 *
 * The merge on the other side always keeps the better of the two sides, so what
 * is returned here can only fail to restore something. It can never roll back a
 * device that has played more than it has managed to upload.
 */
const getJourney = async (req, res) => {
  try {
    const email = callerEmail(req)

    const [facets] = await ARSession.aggregate([
      // The email match is the authorisation check: never another child's journey.
      { $match: { email } },
      {
        $facet: {
          // Summed from the rounds rather than read off `journeyPoints`: that
          // field is one device's running total, and two devices each keep
          // their own, whereas the rounds are the record both of them wrote to.
          totals: [{ $group: { _id: null, points: { $sum: { $ifNull: ['$pointsAwarded', 0] } } } }],
          // Bucketed the same way midnight() buckets, so a journey day and an
          // insights progression row always mean the same 24 hours. Taken
          // newest-first and reversed below: a child with more played days than
          // the client's ring buffer holds should keep the recent ones.
          days: [
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone: 'UTC' } } } },
            { $sort: { _id: -1 } },
            { $limit: MAX_JOURNEY_DAYS },
          ],
          games: [
            {
              $group: {
                _id: '$gameId',
                plays:  { $sum: 1 },
                points: { $sum: { $ifNull: ['$pointsAwarded', 0] } },
                lastPlayedAt:  { $max: { $ifNull: ['$endedAt', '$startedAt'] } },
                playedLevels:  { $addToSet: '$level' },
                clearedLevels: { $addToSet: { $cond: [{ $eq: ['$levelCleared', true] }, '$level', null] } },
                // The highest level cleared *cleanly* — full comprehension and
                // three stars. The client opens two levels for one of those, so
                // without this the restore path hands back one level less than
                // the child earned. Everything needed is on the same session.
                cleanCleared: {
                  $max: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$levelCleared', true] },
                          { $gte: [{ $ifNull: ['$summary.comprehensionPct', 0] }, 92] },
                          { $gte: [{ $ifNull: ['$stars', 0] }, 3] },
                        ],
                      },
                      '$level',
                      null,
                    ],
                  },
                },
              },
            },
            { $sort: { points: -1, _id: 1 } },
            { $limit: MAX_JOURNEY_GAMES },
          ],
        },
      },
    ])

    // Each of those level sets holds at most five numbers, plus a null for the
    // rounds played before the journey existed, so tidying them in JS is
    // cheaper than another pipeline stage and much easier to read.
    const levelsOf = (arr) =>
      [...new Set((Array.isArray(arr) ? arr : []).map(lvl).filter((n) => n != null))].sort((a, b) => a - b)

    const games = (facets?.games || []).map((g) => {
      const clearedInRounds = levelsOf(g.clearedLevels)
      const played = levelsOf(g.playedLevels)
      const top = clearedInRounds.length ? clearedInRounds[clearedInRounds.length - 1] : 0

      // Backfill the levels below the best clear. Level plans are monotone, so
      // clearing level 4 is a claim about 1 to 3, and the device credits them —
      // marked `implied` — without ever uploading a round for them. Returning
      // only the levels a round cleared would therefore hand a child back a
      // journey with holes in it, and cost them the all-five trophy for a game
      // they had finished. This is the same argument getInsights uses below.
      const cleared = []
      for (let n = 1; n <= top; n++) cleared.push(n)

      // A clean clear (comprehension ≥ 92 % and three stars) opens two levels on
      // the device, so the restore has to reproduce that or a child who changes
      // tablet is sent back to re-earn a level they were already shown.
      const cleanTop = lvl(g.cleanCleared) || 0
      const fromClears = top ? Math.max(top + 1, cleanTop ? cleanTop + 2 : 0) : 0

      return {
        gameId: g._id,
        // Clearing a level opens the next one — two for a clean clear. With
        // nothing cleared yet it is the hardest level the child has already
        // chosen to play, so a restore never puts them behind where they were.
        level: Math.min(Math.max(fromClears, played[played.length - 1] || 1), LEVELS),
        plays: g.plays,
        clearedLevels: cleared,
        points: g.points,
        lastPlayedAt: g.lastPlayedAt || null,
      }
    })

    res.json({
      success: true,
      data: {
        points: facets?.totals?.[0]?.points || 0,
        days: (facets?.days || []).map((d) => d._id).reverse(),
        games,
      },
    })
  } catch (err) {
    console.error('getJourney error:', err)
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
      .select('gameId title group domains lifeSkill promptStageEnd startedAt endedAt activeMs stars xp summary '
            + 'level levelCleared clearedBy pointsAwarded')
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

    // ── the journey, over this same window ──
    //
    // Level progression earns a place in the clinical view because it says
    // which demands a child can meet, but it belongs here as evidence and not
    // as a score. So a total is never reported without its provenance beside
    // it, in four separate counts:
    //   criterion the child met the level's comprehension bar — demonstrated.
    //   effort    granted by the anti-wall rule after three near-miss attempts.
    //   unknown   cleared, but the round did not say how.
    //   implied   credited by inference from a higher clear (see below).
    // Points come along only as context for what the child was told they
    // achieved. Independence, in `overall` and `perGame` above, is the headline.
    //
    // Scoped to the same window as everything else here, so it reads as
    // progress made during the period under review — which is why the per-game
    // level is called `levelInWindow` rather than anything that sounds like the
    // child's current standing. GET /api/ar/journey answers that, from their
    // whole history.
    const journeyGames = new Map()
    for (const r of rows) {
      const level = lvl(r.level)
      if (level == null) continue // calibration and setup tasks have no journey
      let g = journeyGames.get(r.gameId)
      if (!g) {
        g = { gameId: r.gameId, title: r.title || r.gameId, played: new Set(), how: new Map(), points: 0 }
        journeyGames.set(r.gameId, g)
      }
      if (r.title) g.title = r.title
      g.played.add(level)
      g.points += num(r.pointsAwarded) || 0
      if (r.levelCleared === true) {
        // Only the two values a round can actually carry are recognised.
        // Anything else — a null from a client that did not say, a value this
        // build has not heard of — is recorded as `unknown` rather than being
        // filed under `effort`. "Granted for persistence" is a specific claim
        // about a child, and asserting it about a clear whose provenance was
        // never sent would be inventing the very distinction this block exists
        // to preserve.
        const how =
          r.clearedBy === 'criterion' ? 'criterion' : r.clearedBy === 'effort' ? 'effort' : 'unknown'
        // Where a level cleared more than once, the strongest evidence stands.
        const rank = { unknown: 0, effort: 1, criterion: 2 }
        if (rank[how] > (rank[g.how.get(level)] ?? -1)) g.how.set(level, how)
      }
    }

    const journeyPerGame = [...journeyGames.values()]
      .map((g) => {
        const cleared = [...g.how.keys()].sort((a, b) => a - b)
        const top = cleared.length ? cleared[cleared.length - 1] : 0
        // Level plans are monotone, so clearing level 4 *is* a claim about
        // levels 1 to 3, and the child's device credits them. It marks those
        // `implied` and never uploads them — a session is a round that actually
        // happened — so they are re-derived here from the same argument, and
        // reported apart from the levels this child was seen to clear. A level
        // the child did demonstrate before this window opened lands here too,
        // which is the honest answer: this window holds no evidence of it.
        let clearedImplied = 0
        for (let n = 1; n < top; n++) if (!g.how.has(n)) clearedImplied++
        const by = (kind) => cleared.filter((n) => g.how.get(n) === kind).length
        return {
          gameId: g.gameId,
          title: g.title,
          // Deliberately NOT called "the level they are on". This block only
          // sees the requested window, so a game cleared at level 4 last term
          // and played at level 2 last week would read as a regression that
          // never happened. `levelInWindow` is the highest level this window
          // has evidence of; GET /api/ar/journey answers "where are they now"
          // from the child's whole history, and so does the on-device journey.
          levelInWindow: top ? Math.min(top + 1, LEVELS) : Math.max(...g.played),
          levelsCleared: cleared.length + clearedImplied,
          clearedByCriterion: by('criterion'),
          clearedByEffort: by('effort'),
          clearedUnknown: by('unknown'),
          clearedImplied,
          points: g.points,
        }
      })
      // Sorted by demonstrated skill first, so a game whose count is mostly
      // inference does not head a list a clinician reads top-down.
      .sort(
        (a, b) =>
          b.clearedByCriterion - a.clearedByCriterion ||
          b.levelsCleared - a.levelsCleared ||
          a.gameId.localeCompare(b.gameId)
      )

    const journeyTotal = (key) => journeyPerGame.reduce((sum, g) => sum + g[key], 0)
    const journey = {
      gamesPlayed: journeyPerGame.length,
      // `levelsCleared` IS the sum of the four kinds — it is how many levels are
      // cleared, which is a real number and the one the child's own screens
      // show. What must never happen is reporting it *without* the split, so
      // every consumer gets both here and the UI shows them together.
      levelsCleared:      journeyTotal('levelsCleared'),
      clearedByCriterion: journeyTotal('clearedByCriterion'),
      clearedByEffort:    journeyTotal('clearedByEffort'),
      clearedUnknown:     journeyTotal('clearedUnknown'),
      clearedImplied:     journeyTotal('clearedImplied'),
      points:             journeyTotal('points'),
      perGame:            journeyPerGame,
    }

    res.json({
      success: true,
      data: {
        days, since, overall, perGame, perDomain, byHand, byPromptLevel, progression, lifeSkills, journey,
      },
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

module.exports = {
  logSession,
  logSessions,
  getSessions,
  getSession,
  getJourney,
  getInsights,
  deleteMySessions,
}
