/**
 * The therapist / parent view of everything the games recorded.
 *
 * The headline is deliberately NOT "8,650 POINTS 🎉". It is:
 *   understanding, independence, thinking time, moving time — four numbers that
 *   mean four different things and can move in opposite directions.
 *
 * Two rules this screen exists to honour:
 *  1. Cognitive accuracy and motor execution speed are never combined. A child
 *     who understands everything and moves slowly must look like exactly that.
 *  2. Nothing here is framed as a diagnosis. These are descriptive summaries of
 *     in-game behaviour, and the screen says so in plain words.
 *
 * Works entirely offline from the on-device history, and enriches from the
 * server when the child is signed in.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Recharts from 'recharts'
import {
  FaArrowLeft, FaChartLine, FaHandPaper, FaBrain, FaHome, FaDownload,
  FaInfoCircle, FaTrash, FaSync, FaRoute, FaExclamationTriangle,
} from 'react-icons/fa'
import { aggregateLocal, localSessions, clearLocalSessions, flushPendingSessions } from '../core/telemetry'
import { loadProfile, CAPABILITIES } from '../core/profile'
import { DOMAIN_LABELS, LIFE_SKILL_LABELS, GROUPS } from '../catalog/groups'
import { GAMES, GAME_BY_ID } from '../catalog/games'
import { LEVELS, journeySnapshot, tileProgress, hasJourney } from '../core/journey'
import { PROMPT_INFO, PROMPT_STAGES } from '../core/adaptive'
import { authHeaders } from '../../utils/authHeaders'
import LevelPips from '../core/LevelPips'
import styles from './ARInsights.module.css'

const {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} = Recharts

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

/* Five tabs have to fit a phone's width, so the labels are one word each where
   they can be. "Journey" leads because it answers the question an adult asks
   first — where is this child up to — and the analytical tabs answer why. */
const TABS = [
  { id: 'journey', label: 'Journey', icon: <FaRoute /> },
  { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
  { id: 'domains', label: 'Skills', icon: <FaBrain /> },
  { id: 'motor', label: 'Movement', icon: <FaHandPaper /> },
  { id: 'life', label: 'Life', icon: <FaHome /> },
]

export default function ARInsights() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('journey')
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // These read localStorage, which React cannot observe, so `refreshKey` is the
  // explicit "the stored data may have changed" signal — bumped by the refresh
  // button and after an erase.
  const sessions = useMemo(() => readStored(localSessions, refreshKey), [refreshKey])
  const local = useMemo(() => aggregateLocal(sessions), [sessions])
  const profile = useMemo(() => readStored(loadProfile, refreshKey), [refreshKey])
  const journey = useMemo(() => readStored(() => journeySnapshot(GAMES), refreshKey), [refreshKey])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Server data is a bonus, not a dependency: this screen must be useful on a
  // school iPad with no signal.
  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt')
    if (!token) return
    const run = async () => {
      setLoading(true)
      // Push anything the network ate first, so the server view includes the
      // rounds this device played offline.
      await flushPendingSessions().catch(() => {})
      try {
        const res = await fetch(`${API}/ar/insights?days=90`, {
          headers: authHeaders(),
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setServer(json.data || json.insights || null)
      } catch {
        /* offline or not signed in — the local view stands on its own */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // Trial data and journey progress are erased separately: the footer's Erase
  // clears the recorded rounds, while levels and points live in the profile and
  // are erased from the settings sheet. So a child can genuinely have a journey
  // and no trials, and treating "no trials" as "nothing to show" would hide
  // their whole progress behind an empty state.
  const hasTrials = Boolean(local?.totalTrials)
  const empty = !hasTrials && !journey.gamesPlayed

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <button className={styles.iconBtn} onClick={() => navigate('/games/ar')} aria-label="Back">
          <FaArrowLeft />
        </button>
        <h1 className={styles.title}>Progress &amp; analysis</h1>
        <div className={styles.headRight}>
          <button
            className={styles.iconBtn}
            onClick={() => setRefreshKey((k) => k + 1)}
            aria-label="Refresh"
            title="Refresh"
          >
            <FaSync className={loading ? styles.spin : ''} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => exportCsv(sessions)}
            aria-label="Export"
            title="Download the trial-level data as CSV"
            disabled={!hasTrials}
          >
            <FaDownload />
          </button>
        </div>
      </header>

      {empty ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <h2>Nothing recorded yet</h2>
          <p>
            Play a camera game and every turn is measured here — what was
            understood, how much help was needed, how long thinking took and how
            long moving took, each kept separate.
          </p>
          <button className={styles.primary} onClick={() => navigate('/games/ar')}>
            Go to the games
          </button>
        </div>
      ) : (
        <>
          {hasTrials && (
          <div className={styles.kpis}>
            <Kpi
              label="Got the idea"
              value={pct(local.comprehensionPct)}
              hint="Correct, plus right answer reached imprecisely or late. This is the understanding number."
              tone="good"
            />
            <Kpi
              label="On their own"
              value={pct(local.independentPct)}
              hint="Correct with no highlight and no demonstration. The independence number."
              tone="good"
            />
            <Kpi
              label="Thinking time"
              value={ms(local.medianLatencyMs)}
              hint="Median time from the instruction to the first intentional movement. A decision measure, not a motor one."
            />
            <Kpi
              label="Moving time"
              value={ms(local.medianMovementMs)}
              hint="Median time from starting to move to touching the target. A motor measure, kept out of accuracy entirely."
            />
            <Kpi
              label="Reach directness"
              value={local.pathEfficiency == null ? '—' : `${Math.round(local.pathEfficiency * 100)}%`}
              hint="Straight-line distance ÷ the path the hand actually travelled. 100% is perfectly direct."
            />
            <Kpi
              label="Turns played"
              value={String(local.totalTrials)}
              hint={`${local.sessions} round${local.sessions === 1 ? '' : 's'} · ${local.minutesPlayed} min`}
            />
          </div>
          )}

          <nav className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.body}>
            {tab === 'journey' && <Journey journey={journey} server={server} />}
            {tab !== 'journey' && !hasTrials ? (
              // The rounds were erased but the journey survived. Say which, so
              // an adult is not left wondering whether the app lost the data.
              <div className={styles.panes}>
                <Card title="No recorded rounds" note="The journey above is intact.">
                  <Placeholder>
                    The trial-level data has been erased, so there is nothing to
                    analyse here. Levels and points are stored separately and are
                    still on the Journey tab. Play a round and these tabs fill up
                    again.
                  </Placeholder>
                </Card>
              </div>
            ) : (
              <>
                {tab === 'overview' && <Overview local={local} server={server} sessions={sessions} />}
                {tab === 'domains' && <Domains local={local} profile={profile} />}
                {tab === 'motor' && <Motor local={local} profile={profile} sessions={sessions} />}
                {tab === 'life' && <LifeSkills local={local} sessions={sessions} />}
              </>
            )}
          </div>
        </>
      )}

      <footer className={styles.foot}>
        <span className={styles.disclaimer}>
          <FaInfoCircle /> These are descriptions of what happened in the games,
          not clinical measures. A high score is not evidence that a skill
          transfers off the screen — that has to be checked in real life.
        </span>
        {!confirmWipe ? (
          <button className={styles.danger} onClick={() => setConfirmWipe(true)} disabled={!hasTrials}>
            <FaTrash /> Erase
          </button>
        ) : (
          <span className={styles.confirm}>
            Erase all recorded rounds?
            <button
              className={styles.danger}
              onClick={async () => {
                clearLocalSessions()
                try {
                  await fetch(`${API}/ar/sessions`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                    credentials: 'include',
                  })
                } catch {
                  /* local wipe already done */
                }
                setConfirmWipe(false)
                setRefreshKey((k) => k + 1)
              }}
            >
              Yes, erase
            </button>
            <button className={styles.ghost} onClick={() => setConfirmWipe(false)}>
              Keep
            </button>
          </span>
        )}
      </footer>
    </div>
  )
}

// ── tabs ─────────────────────────────────────────────────────────────────────
/**
 * The journey, for an adult.
 *
 * Three questions, one card each: where is this child up to, which games and at
 * what level, and — the one that keeps the rest honest — *how* was that progress
 * earned. A report that says "12 levels cleared" without saying that three were
 * granted for persistence and two inferred is a report that overstates a child's
 * skill, so the third card exists and says so in plain words.
 *
 * Points appear here because a child is told about them and an adult should
 * therefore be able to see them. They are not the headline: the KPI strip above
 * this, and the analytical tabs beside it, are about understanding and
 * independence.
 */
function Journey({ journey, server }) {
  const byGroup = useMemo(
    () =>
      GROUPS.map((g) => {
        const st = journey.byGroup[g.id] || { games: 0, played: 0, levels: 0, possible: 0, points: 0 }
        return {
          id: g.id,
          name: g.short,
          title: g.title,
          // Percent, not a count: the groups hold 7 to 14 games each, so raw
          // counts would say "My Day is behind" when it is simply bigger.
          Complete: st.possible ? Math.round((st.levels / st.possible) * 100) : 0,
          levels: st.levels,
          possible: st.possible,
          played: st.played,
          games: st.games,
          pct: st.possible ? Math.round((st.levels / st.possible) * 100) : 0,
        }
      }),
    [journey]
  )

  // Stuck first. A game with several plays and nothing cleared is the single
  // most actionable thing on this screen: it means the level the child is on is
  // asking for something they cannot yet do, and an adult needs to see it
  // rather than have it buried under the games that are going well.
  const games = useMemo(() => {
    const rows = journey.games
      .map((g) => {
        const game = GAME_BY_ID[g.gameId]
        return {
          ...g,
          title: game?.title || g.gameId,
          icon: game?.icon || '🎮',
          pips: game && hasJourney(game) ? tileProgress(game).pips : null,
          stuck: g.plays >= 3 && g.cleared === 0,
        }
      })
      .sort(
        (a, b) =>
          Number(b.stuck) - Number(a.stuck) ||
          b.cleared - a.cleared ||
          b.plays - a.plays
      )
    return rows
  }, [journey])

  const possible = byGroup.reduce((s, g) => s + g.possible, 0)
  const stuckCount = games.filter((g) => g.stuck).length
  // Everything that is not a demonstrated clear is subtracted, including the
  // levels restored from another device — a payload says which levels cleared
  // but not how, so counting those as demonstrated would overstate the child.
  const demonstrated = Math.max(
    0,
    journey.levelsCleared -
      journey.clearedByEffort -
      journey.clearedImplied -
      (journey.clearedRemote || 0)
  )

  return (
    <div className={styles.panes}>
      <Card
        title="Where they are"
        note="Levels cleared per group. The group a child is progressing in is the developmental domain they are actually working on, which is more useful than a total."
      >
        {/* Levels lead and points follow. Points are the child's currency and
            belong on an adult's screen as context, not as the thing their eye
            lands on first — the KPI strip above every tab (understanding,
            independence, thinking time, moving time) is this screen's headline
            and stays visible whichever tab is open. */}
        <div className={styles.jStats}>
          {/* A count, not a fraction of all 340 levels in the catalogue: no
              child is expected to clear every level of all 68 games, and a
              denominator nobody reaches makes real progress look like failure. */}
          <span className={styles.jStat}>
            <strong>{journey.levelsCleared}</strong>levels cleared
          </span>
          <span className={styles.jStat}>
            <strong>{journey.gamesPlayed}</strong>games played
          </span>
          <span className={styles.jStat}>
            <strong>{journey.daysPlayed}</strong>days played
          </span>
          <span className={styles.jStat}>
            <strong>{journey.points}</strong>points
          </span>
          <span className={styles.jStat}>
            <strong>
              {journey.rank.icon} {journey.rank.name}
            </strong>
            rank
          </span>
        </div>
        {possible > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byGroup} margin={{ top: 4, right: 10, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ ...AXIS, fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
              {/* Fixed ticks: with a short card the auto-ticks collapse to a
                  single clipped label, and 0/50/100 is all this chart needs. */}
              <YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tick={AXIS}
                stroke="rgba(255,255,255,0.2)"
                width={40}
                unit="%"
              />
              <Tooltip
                contentStyle={TOOLTIP}
                formatter={(_v, _n, p) => [
                  `${p.payload.levels} of ${p.payload.possible} levels · ${p.payload.played}/${p.payload.games} games tried`,
                  p.payload.title,
                ]}
              />
              <Bar dataKey="Complete" fill="#38d477" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>No journeys started yet.</Placeholder>
        )}
      </Card>

      <Card
        title="Level reached, per game"
        note={
          stuckCount
            ? `${stuckCount} game${stuckCount === 1 ? '' : 's'} played several times with nothing cleared — shown first. That level is asking for something this child cannot do yet.`
            : 'Games played, most progressed first. A game played repeatedly with nothing cleared would appear at the top.'
        }
      >
        {games.length ? (
          <div className={styles.table}>
            {games.slice(0, 9).map((g) => (
              <div key={g.gameId} className={`${styles.row} ${g.stuck ? styles.rowWarn : ''}`}>
                <span className={styles.rowIcon}>{g.icon}</span>
                <span className={styles.rowName}>
                  {g.stuck && <FaExclamationTriangle className={styles.warnIcon} title="Played several times, nothing cleared" />}
                  {g.title}
                </span>
                {g.pips ? (
                  <LevelPips pips={g.pips} size="sm" />
                ) : (
                  <span className={styles.rowStat}>no levels</span>
                )}
                <span className={styles.rowStat} title="Levels cleared">
                  {g.cleared}/{LEVELS}
                </span>
                <span className={styles.rowStat} title="Rounds played">
                  {g.plays} played
                </span>
              </div>
            ))}
            {server?.journey?.perGame?.length > games.length && (
              <div className={styles.rowNote}>
                {server.journey.perGame.length} games with journey data on the server,
                across all this child&apos;s devices
              </div>
            )}
          </div>
        ) : (
          <Placeholder>No games played yet.</Placeholder>
        )}
      </Card>

      <Card
        title="How that progress was earned"
        note="Three different claims, deliberately not added together."
      >
        {/* Each row carries its full text as a tooltip, because the prose is
            clamped to keep all three rows on screen at every size. */}
        <div className={styles.howList}>
          <div
            className={styles.howRow}
            title="The child met the level's comprehension bar. This is evidence."
          >
            <span className={styles.howN}>{demonstrated}</span>
            <span className={styles.howText}>
              <strong>Demonstrated</strong>
              <span>The child met the level&apos;s comprehension bar. This is evidence.</span>
            </span>
          </div>
          <div
            className={styles.howRow}
            title="Three attempts that landed close to the bar. The level opened anyway, so one badly-matched level cannot end a child's use of the app — but it is not evidence they met it."
          >
            <span className={`${styles.howN} ${styles.howSoft}`}>{journey.clearedByEffort}</span>
            <span className={styles.howText}>
              <strong>Given for persistence</strong>
              <span>
                Three attempts that landed close to the bar. The level opened
                anyway, so one badly-matched level cannot end a child&apos;s use of
                the app — but it is not evidence they met it.
              </span>
            </span>
          </div>
          <div
            className={styles.howRow}
            title="Credited because a harder level was cleared, and each level is at least as demanding as the one below. Never observed directly."
          >
            <span className={`${styles.howN} ${styles.howSoft}`}>{journey.clearedImplied}</span>
            <span className={styles.howText}>
              <strong>Inferred</strong>
              <span>
                Credited because a harder level was cleared, and each level is at
                least as demanding as the one below. Never observed directly.
              </span>
            </span>
          </div>
          {/* Only when it happened. Usually zero, and a row of zero would be
              noise — but a child whose progress came back from another device
              has levels this device has no evidence for, and saying so is the
              same honesty the other three rows exist for. */}
          {journey.clearedRemote > 0 && (
            <div
              className={styles.howRow}
              title="Restored from this child's other device. The payload carries which levels cleared but not how, so this device has no evidence for them."
            >
              <span className={`${styles.howN} ${styles.howSoft}`}>{journey.clearedRemote}</span>
              <span className={styles.howText}>
                <strong>Restored from another device</strong>
                <span>
                  Came back from the server, which records which levels cleared
                  but not how. No evidence on this device.
                </span>
              </span>
            </div>
          )}
        </div>

        {journey.badges.length ? (
          <div className={styles.badges}>
            {journey.badges.map((b) => (
              <span key={b.id} className={styles.badgeChip} title={b.how}>
                <span aria-hidden>{b.icon}</span> {b.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className={styles.howFoot}>
          None of these three is evidence of real-world transfer. A cleared level
          means the child did the task on a screen.
        </p>
      </Card>
    </div>
  )
}

function Overview({ local, server, sessions }) {
  const progression = useMemo(() => {
    const byDay = new Map()
    for (const s of sessions) {
      const day = (s.endedAt || s.startedAt || '').slice(0, 10)
      if (!day) continue
      const row = byDay.get(day) || { day, comp: [], indep: [], n: 0 }
      if (s.summary?.comprehensionPct != null) row.comp.push(s.summary.comprehensionPct)
      if (s.summary?.independentPct != null) row.indep.push(s.summary.independentPct)
      row.n++
      byDay.set(day, row)
    }
    return [...byDay.values()]
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14)
      .map((r) => ({
        day: r.day.slice(5),
        Understood: avg(r.comp),
        Independent: avg(r.indep),
        rounds: r.n,
      }))
  }, [sessions])

  const promptMix = useMemo(() => {
    const tally = Object.fromEntries(PROMPT_STAGES.map((p) => [p, 0]))
    let total = 0
    for (const s of sessions) {
      for (const t of s.trials || []) {
        if (t.promptLevel && tally[t.promptLevel] != null) {
          tally[t.promptLevel]++
          total++
        }
      }
    }
    return PROMPT_STAGES.filter((p) => tally[p] > 0).map((p) => ({
      stage: p,
      name: PROMPT_INFO[p].name,
      Turns: total ? Math.round((tally[p] / total) * 1000) / 10 : 0,
    }))
  }, [sessions])

  return (
    <div className={styles.panes}>
      <Card
        title="Understanding and independence over time"
        note="Two lines, because they move separately. A child can understand more while still needing the same amount of help."
      >
        {progression.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progression} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="day" tick={AXIS} stroke="rgba(255,255,255,0.2)" />
              <YAxis domain={[0, 100]} tick={AXIS} stroke="rgba(255,255,255,0.2)" width={38} />
              <Tooltip contentStyle={TOOLTIP} />
              <Legend wrapperStyle={LEGEND} />
              <Line type="monotone" dataKey="Understood" stroke="#7ee8ff" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Independent" stroke="#38d477" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>Play on a second day to see a trend here.</Placeholder>
        )}
      </Card>

      <Card
        title="How much help was needed"
        note="Share of turns at each prompt stage. Fading from A towards D is the goal; stage G is checked off-screen by an adult and can never be awarded by the game."
      >
        {promptMix.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={promptMix} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="stage" tick={AXIS} stroke="rgba(255,255,255,0.2)" />
              <YAxis tick={AXIS} stroke="rgba(255,255,255,0.2)" width={38} unit="%" />
              <Tooltip
                contentStyle={TOOLTIP}
                formatter={(v, _n, p) => [`${v}%`, PROMPT_INFO[p.payload.stage]?.name || '']}
              />
              <Bar dataKey="Turns" fill="#b98cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>No prompt data yet.</Placeholder>
        )}
      </Card>

      <Card title="Games played" note="Accuracy and independence per game, most-played first.">
        <div className={styles.table}>
          {local.games.slice(0, 8).map((g) => (
            <div key={g.gameId} className={styles.row}>
              <span className={styles.rowIcon}>{GAME_BY_ID[g.gameId]?.icon || '🎮'}</span>
              <span className={styles.rowName}>{g.title || g.gameId}</span>
              <span className={styles.rowStat} title="Understood">
                {pct(g.accuracyPct)}
              </span>
              <span className={styles.rowStat} title="Independent">
                {pct(g.independentPct)}
              </span>
              <span className={styles.rowStat} title="Median thinking time">
                {ms(g.medianLatencyMs)}
              </span>
            </div>
          ))}
          {server?.perGame?.length > local.games.length && (
            <div className={styles.rowNote}>
              {server.perGame.length} games recorded on the server across all devices
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function Domains({ local, profile }) {
  const radar = useMemo(
    () =>
      CAPABILITIES.filter((c) => (profile.capabilities?.[c]?.n ?? 0) >= 3).map((c) => ({
        domain: DOMAIN_LABELS[c] || c,
        Estimate: Math.round((profile.capabilities[c].value ?? 0) * 100),
        n: profile.capabilities[c].n,
      })),
    [profile]
  )

  const byDomain = useMemo(
    () =>
      Object.entries(local.byDomain || {})
        .map(([k, v]) => ({ name: DOMAIN_LABELS[k] || k, Accuracy: v.accuracyPct ?? 0, trials: v.trials }))
        .sort((a, b) => a.Accuracy - b.Accuracy)
        .slice(0, 9),
    [local]
  )

  return (
    <div className={styles.panes}>
      <Card
        title="Capability profile"
        note="A running estimate per functional domain, from in-game behaviour only. Domains with fewer than three turns are hidden because the estimate would be noise."
      >
        {radar.length >= 3 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="domain" tick={{ ...AXIS, fontSize: 9 }} />
              <Radar dataKey="Estimate" stroke="#7ee8ff" fill="#7ee8ff" fillOpacity={0.3} />
              <Tooltip contentStyle={TOOLTIP} formatter={(v, _n, p) => [`${v}% (n=${p.payload.n})`, 'Estimate']} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>
            Play a few more games — at least three domains need data before a
            profile means anything.
          </Placeholder>
        )}
      </Card>

      <Card
        title="Weakest first"
        note="Accuracy on turns tagged with each domain. The lowest bars are where the next session is worth spending."
      >
        {byDomain.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDomain} layout="vertical" margin={{ top: 4, right: 14, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={AXIS} stroke="rgba(255,255,255,0.2)" unit="%" />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 9 }} width={92} stroke="rgba(255,255,255,0.2)" />
              <Tooltip contentStyle={TOOLTIP} formatter={(v, _n, p) => [`${v}% of ${p.payload.trials} turns`, 'Accuracy']} />
              <Bar dataKey="Accuracy" fill="#38d477" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>No domain data yet.</Placeholder>
        )}
      </Card>

      <Card title="Prompt stage per game" note="Where the child currently sits on the help ladder in each activity.">
        <div className={styles.table}>
          {Object.entries(profile.games || {})
            .filter(([, g]) => g.trials > 0)
            .sort((a, b) => PROMPT_STAGES.indexOf(a[1].promptStage) - PROMPT_STAGES.indexOf(b[1].promptStage))
            .slice(0, 9)
            .map(([id, g]) => (
              <div key={id} className={styles.row}>
                <span className={styles.rowIcon}>{GAME_BY_ID[id]?.icon || '🎮'}</span>
                <span className={styles.rowName}>{GAME_BY_ID[id]?.title || id}</span>
                <span className={styles.stageChip}>{g.promptStage}</span>
                <span className={styles.rowStat}>{PROMPT_INFO[g.promptStage]?.name}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

function Motor({ local, profile, sessions }) {
  const hands = [
    { name: 'Left hand', ...(local.byHand?.left || {}) },
    { name: 'Right hand', ...(local.byHand?.right || {}) },
  ].filter((h) => h.trials)

  const timing = useMemo(() => {
    const rows = []
    for (const s of sessions) {
      if (s.summary?.timingVariabilityMs == null) continue
      rows.push({
        day: (s.endedAt || s.startedAt || '').slice(5, 10),
        Steadiness: Math.round(s.summary.timingVariabilityMs),
        Offset: Math.round(s.summary.medianTimingErrorMs ?? 0),
      })
    }
    return rows.slice(-12)
  }, [sessions])

  return (
    <div className={styles.panes}>
      <Card
        title="Left and right"
        note="Same task, each hand. A consistent gap in accuracy or directness is worth an adult's attention; a gap in speed alone often is not."
      >
        {hands.length ? (
          <div className={styles.table}>
            {hands.map((h) => (
              <div key={h.name} className={styles.row}>
                <span className={styles.rowIcon}>{h.name.startsWith('Left') ? '🫲' : '🫱'}</span>
                <span className={styles.rowName}>{h.name}</span>
                <span className={styles.rowStat} title="Accuracy">
                  {pct(h.accuracyPct)}
                </span>
                <span className={styles.rowStat} title="Median thinking time">
                  {ms(h.medianLatencyMs)}
                </span>
                <span className={styles.rowStat} title="Reach directness">
                  {h.pathEfficiency == null ? '—' : `${Math.round(h.pathEfficiency * 100)}%`}
                </span>
                <span className={styles.rowStat}>{h.trials} turns</span>
              </div>
            ))}
            {profile.dominantHand && (
              <div className={styles.rowNote}>
                Spontaneously preferred hand: <strong>{profile.dominantHand}</strong> (
                {profile.handUse?.left || 0} left / {profile.handUse?.right || 0} right reaches)
              </div>
            )}
          </div>
        ) : (
          <Placeholder>No per-hand data yet.</Placeholder>
        )}
      </Card>

      <Card
        title="Rhythm timing"
        note="Steadiness is the standard deviation of the timing error and is the meaningful number — a constant offset is just an offset, and part of it is camera lag, which is measured and subtracted per session."
      >
        {timing.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timing} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="day" tick={AXIS} stroke="rgba(255,255,255,0.2)" />
              <YAxis tick={AXIS} stroke="rgba(255,255,255,0.2)" width={40} unit="ms" />
              <Tooltip contentStyle={TOOLTIP} />
              <Legend wrapperStyle={LEGEND} />
              <Line type="monotone" dataKey="Steadiness" stroke="#ffd93d" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Offset" stroke="#ff7ac0" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Placeholder>Play Rhythm Reach a couple of times to see timing here.</Placeholder>
        )}
      </Card>

      <Card title="Reach envelope" note="The calibrated play space every game places targets inside.">
        {profile.reach ? (
          <div className={styles.reachBox}>
            <div className={styles.reachFrame}>
              <div
                className={styles.reachInner}
                style={{
                  left: `${profile.reach.minX * 100}%`,
                  top: `${profile.reach.minY * 100}%`,
                  width: `${(profile.reach.maxX - profile.reach.minX) * 100}%`,
                  height: `${(profile.reach.maxY - profile.reach.minY) * 100}%`,
                }}
              />
            </div>
            <div className={styles.reachStats}>
              <span>
                Width <strong>{Math.round((profile.reach.maxX - profile.reach.minX) * 100)}%</strong> of frame
              </span>
              <span>
                Height <strong>{Math.round((profile.reach.maxY - profile.reach.minY) * 100)}%</strong>
              </span>
              {profile.reachMeta?.asymmetry != null && (
                <span>
                  Left/right difference <strong>{Math.round(profile.reachMeta.asymmetry * 100)}%</strong>
                </span>
              )}
              <span className={styles.reachDate}>
                Set {new Date(profile.reachCalibratedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <Placeholder>
            Not calibrated. Run <strong>Set Up My Space</strong> — until then targets
            use a generic envelope and a restricted reach will look like poor
            accuracy.
          </Placeholder>
        )}
      </Card>
    </div>
  )
}

function LifeSkills({ sessions }) {
  const rows = useMemo(() => {
    const tally = new Map()
    for (const s of sessions) {
      const skill = s.lifeSkill
      if (!skill) continue
      const row = tally.get(skill) || { skill, sessions: 0, trials: 0, correct: 0, independent: 0 }
      row.sessions++
      for (const t of s.trials || []) {
        if (t.accuracy === 'aborted') continue
        row.trials++
        if (t.accuracy === 'correct' || t.accuracy === 'correctInhibit') {
          row.correct++
          if (!t.prompted) row.independent++
        }
      }
      tally.set(skill, row)
    }
    return [...tally.values()]
      .map((r) => ({
        ...r,
        accuracyPct: r.trials ? Math.round((r.correct / r.trials) * 100) : 0,
        independentPct: r.trials ? Math.round((r.independent / r.trials) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
  }, [sessions])

  const sequences = useMemo(() => {
    // Life-skill routines report per-step independence, which is the number
    // that actually tracks "can they do this yet": 3/7 → 5/7 → 6/7 steps.
    const out = []
    for (const s of sessions) {
      for (const t of s.trials || []) {
        if (t.stepsCompletedIndependently == null || !t.steps) continue
        out.push({
          game: GAME_BY_ID[s.gameId]?.title || s.gameId,
          at: (s.endedAt || '').slice(5, 10),
          score: `${t.stepsCompletedIndependently}/${t.steps}`,
          ratio: t.stepsCompletedIndependently / t.steps,
        })
      }
    }
    return out.slice(-8)
  }, [sessions])

  return (
    <div className={styles.panes}>
      <Card
        title="Life skills practised"
        note="Grouped by the real-world skill each game transfers to, not by the game."
      >
        {rows.length ? (
          <div className={styles.table}>
            {rows.slice(0, 9).map((r) => (
              <div key={r.skill} className={styles.row}>
                <span className={styles.rowName}>{LIFE_SKILL_LABELS[r.skill] || r.skill}</span>
                <span className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${r.independentPct}%` }} />
                </span>
                <span className={styles.rowStat}>{r.independentPct}% alone</span>
                <span className={styles.rowStat}>
                  {r.sessions} round{r.sessions === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Placeholder>No life-skill games played yet.</Placeholder>
        )}
      </Card>

      <Card
        title="Routine steps done unaided"
        note="For sequence games like handwashing: how many steps went in the right order without a reminder. 3/7 → 5/7 → 6/7 is what real progress looks like."
      >
        {sequences.length ? (
          <div className={styles.table}>
            {sequences.map((s, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.rowName}>{s.game}</span>
                <span className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${s.ratio * 100}%` }} />
                </span>
                <span className={styles.rowStat}>{s.score}</span>
                <span className={styles.rowStat}>{s.at}</span>
              </div>
            ))}
          </div>
        ) : (
          <Placeholder>Play a routine game (washing, dressing, crossing the road) to see this.</Placeholder>
        )}
      </Card>

      <Card
        title="Real-world transfer"
        note="The stage the game cannot award."
      >
        <div className={styles.transferNote}>
          <p>
            <strong>Stage G is checked by a person, away from the screen.</strong>{' '}
            A child who can pick the toothbrush out of five pictures has not yet
            been shown to pick up the actual toothbrush in the actual bathroom.
          </p>
          <p>
            Use the routine scores above to decide when a skill is worth trying
            for real, then record what happened in your own notes — this app
            deliberately does not claim to have measured it.
          </p>
        </div>
      </Card>
    </div>
  )
}

// ── small pieces ─────────────────────────────────────────────────────────────
function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`${styles.kpi} ${tone === 'good' ? styles.kpiGood : ''}`} title={hint}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}

function Card({ title, note, children }) {
  return (
    <section className={styles.card}>
      <header>
        <h3>{title}</h3>
        {note && <p title={note}>{note}</p>}
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  )
}

function Placeholder({ children }) {
  return <div className={styles.placeholder}>{children}</div>
}

const AXIS = { fill: 'rgba(190,210,238,0.8)', fontSize: 10, fontFamily: 'Fredoka, system-ui, sans-serif' }
const TOOLTIP = {
  background: 'rgba(9,14,32,0.96)',
  border: '1px solid rgba(126,232,255,0.3)',
  borderRadius: 10,
  fontSize: 11,
  fontFamily: 'Fredoka, system-ui, sans-serif',
  color: '#eaf3ff',
}
const LEGEND = { fontSize: 10, fontFamily: 'Fredoka, system-ui, sans-serif' }

/**
 * Reads an external store. The second argument is only there to make the
 * cache-busting key a visible dependency of the caller's useMemo, since React
 * cannot observe localStorage changing.
 */
function readStored(read, key) {
  void key
  return read()
}

const pct = (v) => (v == null ? '—' : `${Math.round(v)}%`)
const ms = (v) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`)
const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null)

/**
 * Trial-level CSV. One row per turn, with cognitive and motor columns kept in
 * separate fields — the point is that this file can be analysed properly, not
 * that it looks tidy.
 */
function exportCsv(sessions) {
  const cols = [
    'sessionId', 'startedAt', 'gameId', 'engine', 'group', 'lifeSkill', 'domains',
    // Round-level journey context, repeated on every trial so a trial can be
    // filtered by the level it was played at without a second join.
    'level', 'levelCleared', 'clearedBy', 'pointsAwarded',
    'trialIndex', 'atMs', 'stage', 'accuracy', 'promptLevel', 'prompted',
    'targetId', 'chosenId', 'choices', 'distractorKind', 'steps', 'memorySpan',
    'rule', 'ruleSwitched',
    'latencyMs', 'movementTimeMs', 'totalMs', 'pathEfficiency', 'peakSpeed',
    'reversals', 'contactError', 'targetRadius', 'hand', 'crossedMidline',
    'bilateralOffsetMs', 'usedBothHands', 'timingErrorMs',
    'coverage', 'traceAccuracy', 'meanDeviation', 'strayCount', 'postureScore',
    'holdBreaks', 'timedOut', 'attempts', 'windowMs', 'pipelineLatencyMs', 'note',
  ]
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.join(',')]
  for (const s of sessions) {
    for (const t of s.trials || []) {
      lines.push(
        [
          s.clientSessionId, s.startedAt, s.gameId, s.engine, s.group, s.lifeSkill,
          (s.domains || []).join('|'),
          s.level, s.levelCleared, s.clearedBy, s.pointsAwarded,
          t.index, t.at, t.stage, t.accuracy, t.promptLevel, t.prompted,
          t.targetId, t.chosenId, t.choices, t.distractorKind, t.steps, t.memorySpan,
          t.rule, t.ruleSwitched,
          t.latencyMs, t.movementTimeMs, t.totalMs, t.pathEfficiency, t.peakSpeed,
          t.reversals, t.contactError, t.targetRadius, t.hand, t.crossedMidline,
          t.bilateralOffsetMs, t.usedBothHands, t.timingErrorMs,
          t.coverage, t.traceAccuracy, t.meanDeviation, t.strayCount, t.postureScore,
          t.holdBreaks, t.timedOut, t.attempts, t.windowMs, t.pipelineLatencyMs, t.note,
        ]
          .map(esc)
          .join(',')
      )
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ar-trials-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

