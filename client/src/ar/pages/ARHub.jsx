/**
 * The AR games hub — a journey map.
 *
 * Two constraints shape everything here.
 *
 * 1. **Nothing scrolls, on any device.** Games are grouped by developmental
 *    domain, one group is shown at a time, and a group with more games than fit
 *    is *paged*. Page arrows and dots are also easier for a child to operate
 *    than a scroll gesture, so the constraint improves the design.
 *
 * 2. **A child with a learning disability has to be able to navigate it alone.**
 *    That means: one tap to play (the tile body starts the level they are on, no
 *    intermediate menu), large targets, a picture before a word, the same five
 *    pips everywhere so the shape is learned once, and a way to hear any label
 *    read aloud rather than having to read it.
 *
 * The journey is the organising idea rather than decoration. Every game shows
 * where the child is on its five-level path; every group shows how much of its
 * path is walked; the header shows the points and rank that accumulate across
 * all of it. A child who cannot see the end of an activity often will not start
 * it, which is exactly why the pips are always visible — including the locked
 * ones.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import * as FramerMotion from 'framer-motion'
import {
  FaArrowLeft, FaChevronLeft, FaChevronRight, FaCog, FaChartLine,
  FaCamera, FaGamepad, FaPlay, FaVolumeUp, FaCheck, FaTrophy,
} from 'react-icons/fa'
import { GROUPS, GROUP_BY_ID, DOMAIN_LABELS } from '../catalog/groups'
import { GAMES, gamesInGroup } from '../catalog/games'
import { prewarmVision } from '../core/vision'
import { flushPendingSessions, fetchRemoteJourney } from '../core/telemetry'
import { isCalibrated, loadProfile } from '../core/profile'
import {
  journeySnapshot, mergeRemoteJourney, tileProgress, hasJourney,
  levelChange, LEVEL_META, LEVELS,
} from '../core/journey'
import { speak } from '../core/tts'
import { haptic } from '../core/feedback'
import LevelPips from '../core/LevelPips'
import SettingsSheet from '../core/SettingsSheet'
import styles from './ARHub.module.css'

/** Tiles per page. The grid is 4×2 in landscape and 2×4 in portrait. */
const PAGE_SIZE = 8

export default function ARHub() {
  const navigate = useNavigate()
  const [groupId, setGroupId] = useState(() => {
    try {
      return localStorage.getItem('ar_last_group') || 'body'
    } catch {
      return 'body'
    }
  })
  const [page, setPage] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  // Bumped when stored progress changes under us (a server merge), so the
  // journey figures below are recomputed rather than left stale.
  const [revision, setRevision] = useState(0)
  const wrapRef = useRef(null)

  const group = GROUP_BY_ID[groupId] || GROUPS[0]
  const games = useMemo(() => gamesInGroup(group.id), [group.id])
  const pages = Math.max(1, Math.ceil(games.length / PAGE_SIZE))
  const pageGames = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const calibrated = isCalibrated()

  // These read localStorage, which the linter cannot see, so `revision` is a
  // deliberate cache-buster rather than a real dependency: it is bumped when
  // stored progress changes and is the only thing that should invalidate them.
  /* eslint-disable react-hooks/exhaustive-deps */
  const journey = useMemo(() => journeySnapshot(GAMES), [revision])
  const recommended = useMemo(() => pickRecommended(), [revision])
  /* eslint-enable react-hooks/exhaustive-deps */

  const open = useCallback(
    (gameId, level) => {
      haptic('tap')
      navigate(level ? `/games/ar/${gameId}?level=${level}` : `/games/ar/${gameId}`)
    },
    [navigate]
  )

  // Warm the models while the child is choosing, so pressing Start goes
  // straight to the camera instead of a two-second model download.
  useEffect(() => {
    const kinds = new Set(['hand'])
    for (const g of games) {
      if (['pose', 'cue', 'bilateral', 'mission'].includes(g.engine)) kinds.add('pose')
      if (g.config?.wholeBody) kinds.add('pose')
    }
    const t = window.setTimeout(() => void prewarmVision([...kinds]), 350)
    return () => window.clearTimeout(t)
  }, [games])

  // Anything the network ate last session gets another go now — and the journey
  // is pulled back from the server, so a child who changes device or clears
  // their browser does not lose their levels. The merge takes the better of the
  // two, so this can never cost them progress.
  useEffect(() => {
    let live = true
    const sync = async () => {
      await flushPendingSessions()
      const remote = await fetchRemoteJourney()
      if (live && remote && mergeRemoteJourney(remote)) setRevision((n) => n + 1)
    }
    void sync()
    return () => {
      live = false
    }
  }, [])

  // Remembering the last group is a side effect; resetting the page is part of
  // choosing a group, so it happens in the handler below instead of here.
  useEffect(() => {
    try {
      localStorage.setItem('ar_last_group', group.id)
    } catch {
      /* private mode */
    }
  }, [group.id])

  const chooseGroup = useCallback((id) => {
    setGroupId(id)
    setPage(0)
    haptic('tap')
  }, [])

  // The hub is a fixed-viewport surface like the games themselves.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Left/right page through the current group, up/down move between groups.
  // A child using a switch or a keyboard can reach every game with four keys.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, pages - 1))
      else if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0))
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const i = GROUPS.findIndex((g) => g.id === groupId)
        const next = (i + (e.key === 'ArrowDown' ? 1 : GROUPS.length - 1)) % GROUPS.length
        chooseGroup(GROUPS[next].id)
      } else if (e.key === 'Escape') navigate('/games')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages, navigate, groupId, chooseGroup])

  const groupStats = journey.byGroup[group.id]

  return (
    <div className={styles.hub} ref={wrapRef} data-group={group.id}>
      <div className={styles.glow} aria-hidden />

      <header className={styles.head}>
        <button className={styles.iconBtn} onClick={() => navigate('/games')} aria-label="Back">
          <FaArrowLeft />
        </button>
        <div className={styles.headTitle}>
          <FaGamepad className={styles.headIcon} />
          <span>Camera Games</span>
        </div>
        <div className={styles.headRight}>
          {/* Points and rank: the one number that is the child's alone, and a
              door into their own progress screen. */}
          <button
            className={styles.pointsChip}
            onClick={() => navigate('/games/ar/insights')}
            title={`${journey.points} points · ${journey.rank.name}${
              journey.rank.next ? ` · ${journey.rank.toNext} to ${journey.rank.next.name}` : ''
            }`}
          >
            <span className={styles.rankIcon} aria-hidden>
              {journey.rank.icon}
            </span>
            <span className={styles.pointsNum}>{journey.points}</span>
            <span
              className={styles.rankBar}
              style={{ '--p': `${Math.round(journey.rank.progress * 100)}%` }}
              aria-hidden
            />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/games/ar/insights')}
            aria-label="Progress"
            title="Progress and analysis"
          >
            <FaChartLine />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <FaCog />
          </button>
        </div>
      </header>

      {/* ── the one thing worth doing next: one tap, no decision to make ── */}
      <div className={styles.callout}>
        {!calibrated ? (
          <button className={styles.calloutBtn} onClick={() => open('setup-space')}>
            <span className={styles.calloutIcon}>🎯</span>
            <span className={styles.calloutText}>
              <strong>Start here — Set Up My Space</strong>
              <em>Five stretches so every game lands where this child can reach</em>
            </span>
            <FaChevronRight />
          </button>
        ) : recommended ? (
          <button
            className={styles.calloutBtn}
            onClick={() => open(recommended.game.id, recommended.level)}
          >
            <span className={styles.calloutIcon}>{recommended.game.icon}</span>
            <span className={styles.calloutText}>
              <strong>{recommended.reason}</strong>
              <em>
                {recommended.game.title}
                {recommended.level ? ` · Level ${recommended.level} of ${LEVELS}` : ''}
              </em>
            </span>
            <span className={styles.calloutGo}>
              <FaPlay /> Play
            </span>
          </button>
        ) : null}
      </div>

      {/* ── the trail of groups, each a ring of how far along it is ── */}
      <nav className={styles.groups} aria-label="Game groups">
        {GROUPS.map((gr) => {
          const st = journey.byGroup[gr.id]
          const pct = st?.possible ? Math.round((st.levels / st.possible) * 100) : 0
          const done = Boolean(st?.possible && st.levels >= st.possible)
          return (
            <button
              key={gr.id}
              className={`${styles.groupPill} ${styles[gr.color]} ${gr.id === group.id ? styles.groupOn : ''}`}
              onClick={() => chooseGroup(gr.id)}
              title={`${gr.title} — ${gr.blurb}${st ? ` · ${st.levels} of ${st.possible} levels` : ''}`}
              aria-current={gr.id === group.id ? 'true' : undefined}
            >
              <span className={styles.ring} style={{ '--p': pct }}>
                <span className={styles.ringIn}>
                  <span className={styles.groupIcon}>{gr.icon}</span>
                </span>
                {done && (
                  <span className={styles.ringDone} aria-hidden>
                    <FaCheck />
                  </span>
                )}
              </span>
              <span className={styles.groupName}>{gr.short}</span>
            </button>
          )
        })}
      </nav>

      <div className={styles.groupBlurb}>
        <strong>{group.title}</strong>
        <span>{group.blurb}</span>
        {groupStats?.possible ? (
          <span className={styles.groupCount}>
            {groupStats.levels}/{groupStats.possible} levels
          </span>
        ) : null}
      </div>

      {/* ── tiles ── */}
      <div className={styles.board}>
        {pages > 1 && (
          <button
            className={`${styles.pageBtn} ${styles.pagePrev}`}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <FaChevronLeft />
          </button>
        )}

        <AnimatePresence mode="wait">
          <FramerMotion.motion.div
            key={`${group.id}-${page}-${revision}`}
            className={styles.grid}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {pageGames.map((g, i) => (
              <GameTile key={g.id} game={g} index={i} onOpen={open} />
            ))}
          </FramerMotion.motion.div>
        </AnimatePresence>

        {pages > 1 && (
          <button
            className={`${styles.pageBtn} ${styles.pageNext}`}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            aria-label="Next page"
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      <footer className={styles.foot}>
        {pages > 1 ? (
          <div className={styles.dots}>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === page ? styles.dotOn : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        ) : (
          <span className={styles.footCount}>
            {games.length} game{games.length === 1 ? '' : 's'}
          </span>
        )}
        <span className={styles.footNote}>
          <FaCamera /> Runs on this device · no video is recorded
        </span>
        <span className={styles.footTotal}>
          {journey.levelsCleared > 0
            ? `${journey.levelsCleared} levels cleared`
            : `${GAMES.length} games in all`}
        </span>
      </footer>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}

/**
 * One game as a stop on a journey.
 *
 * The tile body is the play button and starts the level the child is on, so the
 * common case is a single tap with no menu in between. The pips underneath are
 * the level picker for replaying a cleared level or for an adult jumping ahead,
 * and the speaker reads the game out for a child who cannot read the title.
 *
 * The tile body and the pips are siblings rather than nested buttons: a button
 * inside a button is invalid, and browsers resolve the click unpredictably.
 */
function GameTile({ game, index, onOpen }) {
  const journeyOn = hasJourney(game)
  const p = journeyOn ? tileProgress(game) : null
  const domains = (game.domains || []).slice(0, 2).map((d) => DOMAIN_LABELS[d] || d)
  const meta = p ? LEVEL_META[p.level - 1] : null

  return (
    <FramerMotion.motion.div
      className={`${styles.tile} ${styles[game.color] || styles.blue} ${game.big ? styles.tileBig : ''} ${
        p?.complete ? styles.tileDone : ''
      }`}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.035, duration: 0.24 }}
      whileHover={{ scale: 1.025, y: -3 }}
    >
      <button
        className={styles.tilePlay}
        onClick={() => onOpen(game.id, p?.level)}
        title={
          journeyOn
            ? `${game.title} — level ${p.level} of ${LEVELS}: ${levelChange(game, p.level)}`
            : game.how
        }
      >
        <span className={styles.tileTop}>
          <span className={styles.tileIcon} aria-hidden>
            {game.icon}
          </span>
          {p?.complete ? (
            <span className={styles.doneFlag} title="All five levels cleared">
              <FaTrophy />
            </span>
          ) : p?.plays ? (
            <span className={styles.levelFlag} title={`Level ${p.level} of ${LEVELS}`}>
              {meta.icon} L{p.level}
            </span>
          ) : (
            <span className={styles.newBadge}>New</span>
          )}
        </span>

        <span className={styles.tileTitle}>{game.title}</span>
        <span className={styles.tileHow}>{game.how}</span>

        <span className={styles.tileMeta}>
          {domains.map((d) => (
            <span key={d} className={styles.chip}>
              {d}
            </span>
          ))}
          {game.lifeSkillLabel && <span className={styles.life}>{game.lifeSkillLabel}</span>}
        </span>
      </button>

      <div className={styles.tileBottom}>
        {journeyOn ? (
          <LevelPips pips={p.pips} size="sm" onPick={(n) => onOpen(game.id, n)} />
        ) : (
          <span className={styles.setupNote}>Set-up · no levels</span>
        )}
        <button
          className={styles.speakBtn}
          onClick={() => speak(`${game.title}. ${game.how}`)}
          aria-label={`Read out ${game.title}`}
          title="Read this out"
        >
          <FaVolumeUp />
        </button>
      </div>
    </FramerMotion.motion.div>
  )
}

/**
 * What to suggest next. Deliberately simple and explainable — an adult should
 * be able to see why the app suggested this, and disagree with it.
 *
 * Journey-first, because a half-walked path is the strongest pull there is: a
 * child returning to the app wants to carry on, not to be handed something new.
 */
function pickRecommended() {
  const profile = loadProfile()
  const j = profile.journey || { byGame: {} }
  const played = (id) => j.byGame?.[id]
  const levelOf = (id) => played(id)?.level ?? 1

  // 1. The most recently played game that still has levels to go.
  const inProgress = GAMES.filter((g) => {
    const st = played(g.id)
    if (!st?.plays || !hasJourney(g)) return false
    const cleared = Object.keys(st.cleared || {}).length
    return cleared < LEVELS
  })
  if (inProgress.length) {
    const g = inProgress[inProgress.length - 1]
    return { game: g, level: levelOf(g.id), reason: 'Carry on your journey' }
  }

  // 2. The weakest capability estimate with at least a little evidence, matched
  //    to a featured game that trains it.
  const caps = Object.entries(profile.capabilities || {})
    .filter(([, v]) => v.n >= 5)
    .sort((a, b) => a[1].value - b[1].value)
  for (const [domain] of caps) {
    const candidate = GAMES.find((g) => g.featured && (g.domains || []).includes(domain))
    if (candidate) {
      return {
        game: candidate,
        level: levelOf(candidate.id),
        reason: `Practising ${(DOMAIN_LABELS[domain] || domain).toLowerCase()}`,
      }
    }
  }

  // 3. Nothing played yet — start with something that always works.
  const unplayed = GAMES.filter((g) => g.featured && !played(g.id))
  if (unplayed.length) return { game: unplayed[0], level: 1, reason: 'Try something new' }

  // 4. Every journey finished. Offer the hardest level of a favourite rather
  //    than nothing at all.
  const most = GAMES.filter((g) => played(g.id)).sort(
    (a, b) => (played(b.id).plays || 0) - (played(a.id).plays || 0)
  )[0]
  return most ? { game: most, level: LEVELS, reason: 'Play a champion level' } : null
}
