/**
 * The journey: five visible levels per game, points, unlocks and badges.
 *
 * This sits *on top of* the invisible adaptive staircase in adaptive.js and does
 * a different job, so the two must not be confused:
 *
 *   LEVEL (this file)   Visible, chosen, celebrated. Five stops on a path the
 *                       child can see the end of. A level defines an *envelope*
 *                       of difficulty — a floor and a ceiling on every dimension
 *                       the game uses — and is cleared by understanding, never
 *                       by speed. Clearing one opens the next.
 *
 *   STAIRCASE (adaptive) Invisible, per-trial, moves ONE dimension at a time,
 *                       and now roams only inside the current level's envelope.
 *                       So a child on level 3 is never dropped to level-1 trials
 *                       (boring) or pushed to level-5 trials (frustrating) —
 *                       they are tuned within the band they chose to be in.
 *
 * Why an envelope rather than five fixed presets: the brief is explicit that
 * difficulty must not collapse into "Easy / Medium / Hard", and that demands
 * should move one at a time so an adult can see *which* demand a child is at
 * ceiling on. A level therefore raises the floor of every dimension the game
 * declares, in the rotation order the catalogue gives, while the per-trial
 * staircase still moves one dimension at a time inside it.
 *
 * Points exist to make practice worth repeating. Two rules keep them honest:
 *   - Speed earns nothing. Ever. Points come from participation, understanding
 *     and independence, exactly like the star rating.
 *   - Beating your own previous best on the same game and level pays a bonus,
 *     which is what makes "play it better" — not merely "play it again" — the
 *     thing that pays most.
 *
 * Points are the child's currency and are shown to the child. They are
 * deliberately absent from the clinical view, which is about independence.
 */
import { DIMENSIONS } from './adaptive'
import { clamp } from './geometry'
import { loadProfile, saveProfile } from './profile'
import { getSettings } from './settings'

export const LEVELS = 5

/**
 * The five stops. Names are neutral on purpose — a child who is told they are on
 * "Hard" has been given a label, whereas "Level 3 of 5" is a position on a path.
 * What actually changes at each level is derived from the game (see levelChange).
 */
export const LEVEL_META = [
  { n: 1, name: 'First Steps', icon: '🌱', color: '#6ee7a8' },
  { n: 2, name: 'Warming Up', icon: '🌿', color: '#7fd8ff' },
  { n: 3, name: 'Getting Good', icon: '🌟', color: '#ffd76a' },
  { n: 4, name: 'Strong', icon: '💪', color: '#ffa06a' },
  { n: 5, name: 'Champion', icon: '🏆', color: '#ff8ad4' },
]

/**
 * How much of the total available difficulty a level uses. Level 1 is always the
 * game's own declared starting point and level 5 is always its ceiling, so a
 * journey genuinely ends somewhere.
 */
const LEVEL_FRACTION = [0, 0.2, 0.42, 0.68, 1]

/**
 * Comprehension needed to clear each level, in percent. "Comprehension" is
 * correct plus near — the child who reached the right answer imprecisely
 * understood the task, so they progress. Speed is not in this number.
 */
const CLEAR_BAR = [55, 60, 65, 70, 75]

/** A round shorter than this is a sample, not an attempt. */
const MIN_TRIALS = 4

/**
 * The anti-wall rule. A child who attempts a level this many times and gets
 * within EFFORT_MARGIN of the bar moves on anyway, recorded as cleared *by
 * effort* rather than by criterion so the distinction survives into the clinical
 * view. Without this, one poorly-matched level can end a child's use of the app.
 */
const EFFORT_ATTEMPTS = 3
const EFFORT_MARGIN = 20

/** Child-facing ranks. Cosmetic; never used clinically. */
export const RANKS = [
  { at: 0, name: 'Explorer', icon: '🧭' },
  { at: 250, name: 'Pathfinder', icon: '🗺️' },
  { at: 750, name: 'Trailblazer', icon: '⛰️' },
  { at: 1750, name: 'Sky Walker', icon: '🎈' },
  { at: 3500, name: 'Star Rider', icon: '🌠' },
  { at: 6000, name: 'Legend', icon: '👑' },
  { at: 10000, name: 'Grand Champion', icon: '🏅' },
]

export function rankFor(points = 0) {
  let cur = RANKS[0]
  let next = null
  for (const r of RANKS) {
    if (points >= r.at) cur = r
    else {
      next = r
      break
    }
  }
  const span = next ? next.at - cur.at : 0
  return {
    ...cur,
    next,
    toNext: next ? next.at - points : 0,
    progress: span ? clamp((points - cur.at) / span, 0, 1) : 1,
  }
}

export const clampLevel = (n) => clamp(Math.round(Number(n) || 1), 1, LEVELS)

// ── the level → difficulty envelope ──────────────────────────────────────────
/** The difficulty dimensions a game actually declares, filtered to known ones. */
export function dimsOf(game) {
  return (game?.adaptive?.dimensions || ['targetSize', 'choices']).filter((d) => DIMENSIONS[d])
}

/** Does this game have a journey at all? Calibration and setup tasks do not. */
export function hasJourney(game) {
  return game?.journey !== false && dimsOf(game).length > 0
}

function startIndex(game, dim) {
  const max = DIMENSIONS[dim].values.length - 1
  return clamp(game?.adaptive?.start?.[dim] ?? 0, 0, max)
}

/**
 * The floor indices for a level: the *least* demanding trial the child will be
 * given while they are on it.
 *
 * The budget of steps is spent round-robin through the game's declared rotation,
 * so no single demand runs far ahead of the others — the same principle the
 * per-trial staircase uses, applied to the envelope.
 */
export function levelPlan(game, level) {
  const dims = dimsOf(game)
  const lv = clampLevel(level)
  const plan = {}
  const room = {}
  let total = 0
  for (const d of dims) {
    const start = startIndex(game, d)
    plan[d] = start
    room[d] = DIMENSIONS[d].values.length - 1 - start
    total += room[d]
  }
  if (!total) return plan

  let budget = Math.round(LEVEL_FRACTION[lv - 1] * total)
  // `guard` bounds the loop even if `room` and `budget` ever disagree.
  let guard = 0
  while (budget > 0 && guard <= total + dims.length) {
    let spent = false
    for (const d of dims) {
      if (budget <= 0) break
      if (plan[d] - startIndex(game, d) < room[d]) {
        plan[d] += 1
        budget -= 1
        spent = true
      }
    }
    if (!spent) break
    guard++
  }
  return plan
}

/**
 * The floor and ceiling the per-trial staircase may move between while the child
 * is on `level`. The ceiling is the next level's floor, so a child who is flying
 * gets a taste of what is coming without leaving the level they chose.
 */
export function levelBounds(game, level) {
  const lv = clampLevel(level)
  const floor = levelPlan(game, lv)
  const ceil = {}
  const above = lv < LEVELS ? levelPlan(game, lv + 1) : null
  for (const d of Object.keys(floor)) {
    const max = DIMENSIONS[d].values.length - 1
    ceil[d] = lv >= LEVELS ? max : clamp(Math.max(above[d], floor[d]), floor[d], max)
  }
  return { floor, ceil, level: lv }
}

/**
 * What actually got harder between two levels, in plain words, for the tile and
 * the level picker. Derived from the game's own dimensions rather than written
 * per game, so it cannot drift out of step with what the engine does.
 */
export function levelChange(game, level) {
  const lv = clampLevel(level)
  if (lv <= 1) return 'Everything big, slow and helped'
  const before = levelPlan(game, lv - 1)
  const now = levelPlan(game, lv)
  const moved = Object.keys(now)
    .filter((d) => now[d] > before[d])
    .map((d) => HARDER_WORDS[d] || DIMENSIONS[d].label.toLowerCase())
  if (!moved.length) return 'A little more practice at this'
  const shown = moved.slice(0, 2).join(' · ')
  return moved.length > 2 ? `${shown} · and more` : shown
}

/** Plain-language "this got harder" phrasing per dimension. */
const HARDER_WORDS = {
  targetSize: 'smaller targets',
  choices: 'more to choose from',
  distractors: 'trickier wrong answers',
  eccentricity: 'further to reach',
  steps: 'more steps to remember',
  memorySpan: 'more to hold in mind',
  showMs: 'a shorter look',
  window: 'less waiting time',
  ruleSwitch: 'the rule changes',
  hands: 'both hands',
  midline: 'reaching across',
  pace: 'a faster beat',
  noGoRate: 'more times to stop',
  tolerance: 'a narrower path',
  holdMs: 'a longer hold',
}

// ── stored journey state ─────────────────────────────────────────────────────
const blankJourney = () => ({
  points: 0,
  lifetimePoints: 0,
  byGame: {},
  badges: [],
  days: [], // ISO dates played, newest last
  updatedAt: null,
})

const blankGame = () => ({
  level: 1, // highest unlocked level; the child plays this one by default
  cleared: {}, // { '1': { at, by, comprehensionPct } }
  best: {}, // { '1': { score, comprehensionPct, independentPct, stars, points, at } }
  attempts: {}, // { '1': n }
  plays: 0,
  points: 0,
})

/** The journey block, repaired in place if an older profile lacks parts of it. */
export function journeyState() {
  const p = loadProfile()
  if (!p.journey || typeof p.journey !== 'object' || Array.isArray(p.journey)) {
    p.journey = blankJourney()
  }
  const j = p.journey
  if (!Number.isFinite(j.points)) j.points = 0
  if (!Number.isFinite(j.lifetimePoints)) j.lifetimePoints = j.points
  if (!j.byGame || typeof j.byGame !== 'object') j.byGame = {}
  if (!Array.isArray(j.badges)) j.badges = []
  if (!Array.isArray(j.days)) j.days = []
  return j
}

export function gameJourney(gameId) {
  const j = journeyState()
  const cur = j.byGame[gameId]
  if (!cur || typeof cur !== 'object') {
    j.byGame[gameId] = blankGame()
    return j.byGame[gameId]
  }
  // Repair rather than replace: a partially-written entry must not lose progress.
  const base = blankGame()
  for (const k of Object.keys(base)) {
    if (cur[k] == null || typeof cur[k] !== typeof base[k]) cur[k] = base[k]
  }
  cur.level = clampLevel(cur.level)
  return cur
}

/** Highest level the child may choose. `journeyUnlockAll` is the adult override. */
export function unlockedThrough(gameId) {
  if (getSettings().journeyUnlockAll) return LEVELS
  return clampLevel(gameJourney(gameId).level)
}

export function isUnlocked(gameId, level) {
  return clampLevel(level) <= unlockedThrough(gameId)
}

export function isCleared(gameId, level) {
  return Boolean(gameJourney(gameId).cleared[String(clampLevel(level))])
}

export function levelsCleared(gameId) {
  const g = gameJourney(gameId)
  let n = 0
  for (let i = 1; i <= LEVELS; i++) if (g.cleared[String(i)]) n++
  return n
}

export function bestAt(gameId, level) {
  return gameJourney(gameId).best[String(clampLevel(level))] || null
}

/** Everything a tile needs, in one read. */
export function tileProgress(game) {
  const g = gameJourney(game.id)
  const unlocked = unlockedThrough(game.id)
  return {
    level: clampLevel(g.level),
    unlocked,
    plays: g.plays,
    points: g.points,
    cleared: levelsCleared(game.id),
    complete: levelsCleared(game.id) >= LEVELS,
    pips: Array.from({ length: LEVELS }, (_, i) => {
      const n = i + 1
      return {
        n,
        cleared: Boolean(g.cleared[String(n)]),
        unlocked: n <= unlocked,
        current: n === clampLevel(g.level) && !g.cleared[String(n)],
        stars: bestAt(game.id, n)?.stars ?? 0,
      }
    }),
  }
}

// ── which level a round is being played at ───────────────────────────────────
/**
 * The level of the round in progress. Engines call `resolveDifficulty(game)`
 * with nothing but the game, so the level has to be ambient for the duration of
 * a round rather than threaded through every engine signature.
 */
let ACTIVE = null

export function setActiveLevel(gameId, level) {
  ACTIVE = { gameId, level: clampLevel(level) }
  return ACTIVE.level
}

export function clearActiveLevel() {
  ACTIVE = null
}

export function activeLevel(gameId) {
  if (ACTIVE) {
    if (ACTIVE.gameId === gameId) return ACTIVE.level
    // A mission stage is `<missionId>:<stageId>` and plays at the mission's
    // level, so the whole day is one difficulty rather than eight.
    const cut = gameId.indexOf(':')
    if (cut > 0 && gameId.slice(0, cut) === ACTIVE.gameId) return ACTIVE.level
  }
  return clampLevel(gameJourney(gameId).level)
}

/**
 * Which level a request resolves to: the one asked for if it is unlocked, else
 * the highest that is. Pure — safe to call during render.
 *
 * In `fixed` difficulty mode the therapist has pinned the difficulty, and the
 * round has to be *judged* at the level it was actually played at — otherwise a
 * child doing level-5 work would be credited against level 1's clear bar and
 * paid level 1's points. The pin therefore overrides the unlock as well: an
 * adult who deliberately set level 5 and saw the child clear it has produced
 * exactly the evidence the unlock exists to require.
 */
export function resolveLevel(game, requested) {
  if (!hasJourney(game)) return 1
  const s = getSettings()
  if (s.difficultyMode === 'fixed') return clampLevel(s.fixedLevel)
  const unlocked = unlockedThrough(game.id)
  const wanted = requested == null ? clampLevel(gameJourney(game.id).level) : clampLevel(requested)
  return Math.min(wanted, unlocked)
}

/** Is the level fixed by an adult rather than chosen by the child? */
export function levelIsPinned() {
  return getSettings().difficultyMode === 'fixed'
}

/**
 * Opens a round: settles the level and makes it ambient for the engines.
 * Must be called before the game module is constructed, because a module
 * resolves its difficulty during construction.
 */
export function beginRound(game, requested) {
  if (!hasJourney(game)) {
    clearActiveLevel()
    return { level: 1, journey: false }
  }
  const level = resolveLevel(game, requested)
  setActiveLevel(game.id, level)
  return { level, journey: true, unlocked: unlockedThrough(game.id) }
}

// ── points ───────────────────────────────────────────────────────────────────
/**
 * The one place points are decided.
 *
 * `quality` is the same weighting as the star rating — understanding at three
 * quarters, independence at one quarter, speed at nothing — so the points a
 * child sees and the stars they see can never tell different stories.
 */
export function pointsFor(opts) {
  const { summary, level = 1, cleared, firstClear, beatBest, firstToday, journey = true } = opts
  const trials = summary?.trials || 0
  const comprehension = (summary?.comprehensionPct ?? 0) / 100
  const independence = (summary?.independentPct ?? 0) / 100
  const rows = []

  // Turning up and taking turns always pays something. This is the "play more"
  // half of the request, and it is the half that matters for a child who is
  // having a bad day.
  const played = 10 + Math.min(trials, 24) * 2
  rows.push({ key: 'played', label: `${trials} turn${trials === 1 ? '' : 's'} played`, points: played, icon: '🎮' })

  const quality = Math.round(60 * (comprehension * 0.75 + independence * 0.25))
  if (quality > 0) rows.push({ key: 'quality', label: 'Got it right', points: quality, icon: '✅' })

  const mult = journey ? 1 + (clampLevel(level) - 1) * 0.2 : 1
  let total = Math.round((played + quality) * mult)
  if (mult > 1) {
    rows.push({
      key: 'level',
      label: `Level ${clampLevel(level)} bonus`,
      points: total - (played + quality),
      icon: LEVEL_META[clampLevel(level) - 1].icon,
    })
  }

  // "Play the same game better and your points go up": beating your own best on
  // this game and level is the largest single bonus available.
  if (beatBest) {
    rows.push({ key: 'best', label: 'Your best yet!', points: 30, icon: '🎉' })
    total += 30
  }
  if (cleared && firstClear) {
    rows.push({ key: 'clear', label: 'Level cleared', points: 40, icon: '🔓' })
    total += 40
  } else if (cleared) {
    rows.push({ key: 'again', label: 'Level passed again', points: 12, icon: '👍' })
    total += 12
  }
  if (firstToday) {
    rows.push({ key: 'today', label: 'First game today', points: 15, icon: '📅' })
    total += 15
  }

  return { total: Math.max(0, Math.round(total)), rows }
}

// ── badges ───────────────────────────────────────────────────────────────────
/**
 * Few, and each one earned by something real. No badge is awarded for speed, and
 * none for a streak that can be broken — losing a badge would teach exactly the
 * wrong lesson to a child who missed a week because they were unwell.
 */
export const BADGES = [
  { id: 'first-game', name: 'Started', icon: '🎈', how: 'Played your first camera game' },
  { id: 'space-set', name: 'My Space', icon: '🎯', how: 'Set up your reach' },
  { id: 'five-days', name: 'Kept Going', icon: '📅', how: 'Played on five different days' },
  { id: 'level-3', name: 'Halfway', icon: '🌟', how: 'Cleared three levels of one game' },
  { id: 'all-five', name: 'Full Journey', icon: '🏆', how: 'Cleared all five levels of a game' },
  { id: 'ten-games', name: 'Explorer', icon: '🧭', how: 'Tried ten different games' },
  { id: 'every-group', name: 'All Around', icon: '🗺️', how: 'Played a game from every group' },
  { id: 'both-hands', name: 'Two Hands', icon: '🤲', how: 'Used both hands plenty' },
  { id: 'on-my-own', name: 'On My Own', icon: '🦋', how: 'Answered without help in a game' },
  { id: 'whole-day', name: 'Whole Day', icon: '🌞', how: 'Finished a whole-day mission' },
]

const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]))

/**
 * @param {object[]} allGames the catalogue, injected so this module never
 *        imports the catalogue (which imports the engines, which import this).
 */
function earnedBadges(allGames = []) {
  const p = loadProfile()
  const j = journeyState()
  const out = new Set(j.badges)
  const played = Object.entries(j.byGame).filter(([, g]) => g.plays > 0)

  if (played.length) out.add('first-game')
  if (p.reach) out.add('space-set')
  if (j.days.length >= 5) out.add('five-days')
  if (played.some(([id]) => levelsCleared(id) >= 3)) out.add('level-3')
  if (played.some(([id]) => levelsCleared(id) >= LEVELS)) out.add('all-five')
  if (played.length >= 10) out.add('ten-games')
  if ((p.handUse?.left || 0) >= 40 && (p.handUse?.right || 0) >= 40) out.add('both-hands')
  if (Object.values(p.games || {}).some((g) => ['D', 'E', 'F'].includes(g.promptStage))) {
    out.add('on-my-own')
  }
  if (allGames.length) {
    const byId = Object.fromEntries(allGames.map((g) => [g.id, g]))
    const groups = new Set(played.map(([id]) => byId[id]?.group).filter(Boolean))
    const allGroups = new Set(allGames.map((g) => g.group))
    if (groups.size >= allGroups.size) out.add('every-group')
    if (played.some(([id]) => byId[id]?.engine === 'mission' && levelsCleared(id) > 0)) {
      out.add('whole-day')
    }
  }
  return [...out]
}

export function badgeInfo(id) {
  return BADGE_BY_ID[id] || null
}

// ── recording a finished round ───────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10)

/** The quality score levels, points and personal bests all agree on. */
const scoreOf = (summary) =>
  ((summary?.comprehensionPct ?? 0) / 100) * 0.75 + ((summary?.independentPct ?? 0) / 100) * 0.25

/**
 * Judges one finished round, awards points, moves the unlock forward and returns
 * everything the results screen and the uploaded session need.
 *
 * Called exactly once per round, from ARStage.
 */
export function recordRound(game, summary, stars, opts = {}) {
  const journeyOn = hasJourney(game)
  const level = journeyOn ? activeLevel(game.id) : 1
  const key = String(level)
  const j = journeyState()
  const g = gameJourney(game.id)

  const trials = summary?.trials || 0
  const comprehension = summary?.comprehensionPct ?? 0
  const bar = CLEAR_BAR[level - 1]

  const wasCleared = Boolean(g.cleared[key])
  const enough = trials >= MIN_TRIALS

  // Only a real attempt counts towards the anti-wall rule. `effort` asserts that
  // a child tried this level three times and came close; a round they opened and
  // walked away from after one turn is not one of those tries, and counting it
  // would let three abandoned rounds plus one near-miss grant a level.
  const attempts = (g.attempts[key] || 0) + (enough ? 1 : 0)
  if (enough) g.attempts[key] = attempts
  const metBar = enough && comprehension >= bar
  // The anti-wall rule: real, repeated effort that lands close to the bar counts.
  const byEffort =
    !metBar && enough && attempts >= EFFORT_ATTEMPTS && comprehension >= bar - EFFORT_MARGIN
  const cleared = journeyOn && (metBar || byEffort)
  const clearedBy = cleared ? (metBar ? 'criterion' : 'effort') : null

  // Personal best, per game AND per level, because beating your best at level 4
  // is a different achievement from beating it at level 1.
  //
  // The `score > 0.02` floor matters: without it a child's very first round
  // counts as a personal best whatever happened, so a round where nothing at
  // all went right would be celebrated as "your best yet". A first round has to
  // be worth something before it becomes the bar to beat.
  const score = scoreOf(summary)
  const prevBest = g.best[key] || null
  const beatBest = enough && score > 0.02 && score > (prevBest?.score ?? 0) + 0.02

  const firstToday = !j.days.includes(todayKey())

  const points = pointsFor({
    summary,
    level,
    cleared,
    firstClear: cleared && !wasCleared,
    beatBest,
    firstToday,
    journey: journeyOn,
  })

  // ── commit ──
  g.plays += 1
  g.points += points.total
  j.points += points.total
  j.lifetimePoints = (j.lifetimePoints || 0) + points.total
  if (firstToday) j.days = [...j.days, todayKey()].slice(-400)

  if (beatBest) {
    g.best[key] = {
      score: Math.round(score * 1000) / 1000,
      comprehensionPct: comprehension,
      independentPct: summary?.independentPct ?? null,
      stars: stars ?? 0,
      points: points.total,
      at: new Date().toISOString(),
    }
  }

  let unlockedLevel = null
  if (cleared) {
    const at = new Date().toISOString()
    if (!wasCleared) {
      g.cleared[key] = { at, by: clearedBy, comprehensionPct: comprehension }
    }
    // Level plans are monotone — every level is at least as demanding as the one
    // below it — so clearing level 4 *is* evidence for levels 1 to 3. Backfilling
    // them keeps the path readable when a child skipped ahead, and it is what
    // makes "all five" reachable for a child who never played level 2. Marked
    // `implied` so the clinical view can tell inference from evidence.
    for (let n = 1; n < level; n++) {
      const k = String(n)
      if (!g.cleared[k]) g.cleared[k] = { at, by: 'implied', comprehensionPct: null }
    }
    // A child who clears a level outright and independently should not have to
    // grind the next one to get to where they already are, so a clean clear
    // opens two.
    const clean = comprehension >= 92 && (stars ?? 0) >= 3
    const target = clampLevel(level + (clean ? 2 : 1))
    if (target > g.level) {
      unlockedLevel = target
      g.level = target
    }
  }

  const before = new Set(j.badges)
  j.badges = earnedBadges(opts.allGames || [])
  const newBadges = j.badges.filter((b) => !before.has(b)).map(badgeInfo).filter(Boolean)
  j.updatedAt = new Date().toISOString()
  saveProfile(loadProfile())

  const nextLevel = cleared && level < LEVELS ? clampLevel(level + 1) : null
  return {
    journey: journeyOn,
    level,
    levelName: LEVEL_META[level - 1].name,
    levelIcon: LEVEL_META[level - 1].icon,
    bar,
    comprehensionPct: comprehension,
    attempts,
    cleared,
    clearedBy,
    alreadyCleared: wasCleared,
    beatBest,
    previousBest: prevBest,
    points,
    unlockedLevel,
    nextLevel,
    nextLevelUnlocked: nextLevel != null && nextLevel <= unlockedThrough(game.id),
    totalPoints: j.points,
    rank: rankFor(j.points),
    newBadges,
    levelsCleared: levelsCleared(game.id),
    complete: levelsCleared(game.id) >= LEVELS,
    // What the child needs to hear when they did not clear. Never "you failed":
    // it names the one thing that would clear it.
    advice: cleared
      ? null
      : !enough
        ? 'Play a few more turns to finish this level'
        : `Get ${bar}% of the turns right to open the next level`,
  }
}

/** Snapshot for the insights screen and for the uploaded session. */
export function journeySnapshot(allGames = []) {
  const j = journeyState()
  const games = Object.entries(j.byGame)
    .filter(([, g]) => g.plays > 0)
    .map(([id, g]) => ({
      gameId: id,
      level: clampLevel(g.level),
      cleared: levelsCleared(id),
      plays: g.plays,
      points: g.points,
      // Kept apart so a clinician can tell what was demonstrated from what was
      // inferred, granted for persistence, or merely restored from a server
      // payload that carries which levels cleared but not how. Anything that is
      // not 'criterion' must be counted somewhere other than "demonstrated".
      clearedByEffort: Object.values(g.cleared).filter((c) => c?.by === 'effort').length,
      clearedImplied: Object.values(g.cleared).filter((c) => c?.by === 'implied').length,
      clearedRemote: Object.values(g.cleared).filter((c) => c?.by === 'remote').length,
      bestScore: Math.max(0, ...Object.values(g.best).map((b) => b?.score ?? 0)),
    }))
    .sort((a, b) => b.points - a.points)

  const byGroup = {}
  if (allGames.length) {
    for (const game of allGames) {
      const grp = (byGroup[game.group] = byGroup[game.group] || {
        games: 0,
        played: 0,
        levels: 0,
        possible: 0,
        points: 0,
      })
      grp.games++
      grp.possible += hasJourney(game) ? LEVELS : 0
      const g = j.byGame[game.id]
      if (g?.plays) {
        grp.played++
        grp.levels += levelsCleared(game.id)
        grp.points += g.points
      }
    }
  }

  return {
    points: j.points,
    rank: rankFor(j.points),
    daysPlayed: j.days.length,
    lastPlayedDay: j.days[j.days.length - 1] || null,
    badges: j.badges.map(badgeInfo).filter(Boolean),
    gamesPlayed: games.length,
    levelsCleared: games.reduce((s, g) => s + g.cleared, 0),
    clearedByEffort: games.reduce((s, g) => s + g.clearedByEffort, 0),
    clearedImplied: games.reduce((s, g) => s + g.clearedImplied, 0),
    clearedRemote: games.reduce((s, g) => s + g.clearedRemote, 0),
    games,
    byGroup,
  }
}

/**
 * Merges a server-side journey summary into the local one, taking the better of
 * the two per field. Called when the hub loads so a child who moves to another
 * device does not lose their journey — and so a device that was offline is never
 * overwritten by a staler server copy.
 */
export function mergeRemoteJourney(remote) {
  if (!remote || typeof remote !== 'object') return null
  const j = journeyState()
  let changed = false

  if (Number.isFinite(remote.points) && remote.points > j.points) {
    j.points = Math.round(remote.points)
    changed = true
  }
  for (const rg of Array.isArray(remote.games) ? remote.games : []) {
    if (!rg?.gameId) continue
    const g = gameJourney(rg.gameId)
    if (Number.isFinite(rg.level) && clampLevel(rg.level) > g.level) {
      g.level = clampLevel(rg.level)
      changed = true
    }
    if (Number.isFinite(rg.plays) && rg.plays > g.plays) {
      g.plays = Math.round(rg.plays)
      changed = true
    }
    for (const lv of Array.isArray(rg.clearedLevels) ? rg.clearedLevels : []) {
      const k = String(clampLevel(lv))
      if (!g.cleared[k]) {
        g.cleared[k] = { at: rg.lastPlayedAt || null, by: 'remote', comprehensionPct: null }
        changed = true
      }
    }
  }
  for (const day of Array.isArray(remote.days) ? remote.days : []) {
    if (typeof day === 'string' && !j.days.includes(day)) {
      j.days.push(day)
      changed = true
    }
  }
  if (changed) {
    j.days.sort()
    saveProfile(loadProfile())
  }
  return changed
}

/** Wipes the journey with the rest of the profile. Used by the Data settings tab. */
export function resetJourney() {
  const p = loadProfile()
  p.journey = blankJourney()
  saveProfile(p)
  clearActiveLevel()
  return p.journey
}
