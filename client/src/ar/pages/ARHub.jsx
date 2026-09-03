/**
 * The AR games hub.
 *
 * Design constraint that shapes everything here: **nothing scrolls, on any
 * device**. Games are therefore grouped by developmental domain, one group is
 * shown at a time, and a group with more games than fit is *paged* rather than
 * scrolled. Page arrows and dots are also easier for a child to operate than a
 * scroll gesture, so the constraint improves the design rather than fighting it.
 *
 * Tiles show what the game trains and where the child currently is on the
 * prompt ladder, because the adult choosing is usually choosing a target, not a
 * theme.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import * as FramerMotion from 'framer-motion'
import {
  FaArrowLeft, FaChevronLeft, FaChevronRight, FaCog, FaChartLine,
  FaStar, FaCamera, FaGamepad,
} from 'react-icons/fa'
import { GROUPS, GROUP_BY_ID, DOMAIN_LABELS } from '../catalog/groups'
import { GAMES, gamesInGroup } from '../catalog/games'
import { ENGINE_VERBS } from '../engines/registry'
import { prewarmVision } from '../core/vision'
import { flushPendingSessions } from '../core/telemetry'
import { isCalibrated, gameState, loadProfile } from '../core/profile'
import { nextTargetFor, PROMPT_INFO } from '../core/adaptive'
import { getSettings } from '../core/settings'
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
  const wrapRef = useRef(null)

  const group = GROUP_BY_ID[groupId] || GROUPS[0]
  const games = useMemo(() => gamesInGroup(group.id), [group.id])
  const pages = Math.max(1, Math.ceil(games.length / PAGE_SIZE))
  const pageGames = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const calibrated = isCalibrated()

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

  // Anything the network ate last session gets another go now.
  useEffect(() => {
    void flushPendingSessions()
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

  const chooseGroup = (id) => {
    setGroupId(id)
    setPage(0)
  }

  // The hub is a fixed-viewport surface like the games themselves.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, pages - 1))
      else if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0))
      else if (e.key === 'Escape') navigate('/games')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages, navigate])

  // Recomputed whenever the stored history changes (refreshKey is bumped by a
  // remount), not on every render — pickRecommended reads localStorage.
  const recommended = useMemo(() => pickRecommended(), [])

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

      {/* ── the one thing worth doing next ── */}
      <div className={styles.callout}>
        {!calibrated ? (
          <button className={styles.calloutBtn} onClick={() => navigate('/games/ar/setup-space')}>
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
            onClick={() => navigate(`/games/ar/${recommended.game.id}`)}
          >
            <span className={styles.calloutIcon}>{recommended.game.icon}</span>
            <span className={styles.calloutText}>
              <strong>{recommended.reason}</strong>
              <em>
                {recommended.game.title} · {PROMPT_INFO[recommended.stage]?.name}
              </em>
            </span>
            <FaChevronRight />
          </button>
        ) : null}
      </div>

      {/* ── group selector ── */}
      <nav className={styles.groups} aria-label="Game groups">
        {GROUPS.map((gr) => (
          <button
            key={gr.id}
            className={`${styles.groupPill} ${styles[gr.color]} ${gr.id === group.id ? styles.groupOn : ''}`}
            onClick={() => chooseGroup(gr.id)}
            title={gr.blurb}
          >
            <span className={styles.groupIcon}>{gr.icon}</span>
            <span className={styles.groupName}>{gr.short}</span>
          </button>
        ))}
      </nav>

      <div className={styles.groupBlurb}>
        <strong>{group.title}</strong>
        <span>{group.blurb}</span>
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
            key={`${group.id}-${page}`}
            className={styles.grid}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {pageGames.map((g, i) => (
              <GameTile key={g.id} game={g} index={i} onOpen={() => navigate(`/games/ar/${g.id}`)} />
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
        <span className={styles.footTotal}>{GAMES.length} games in all</span>
      </footer>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function GameTile({ game, index, onOpen }) {
  const st = gameState(game.id)
  const next = nextTargetFor(game)
  const stars = starsFromHistory(st)
  const domains = (game.domains || []).slice(0, 2).map((d) => DOMAIN_LABELS[d] || d)

  return (
    <FramerMotion.motion.button
      className={`${styles.tile} ${styles[game.color] || styles.blue} ${game.big ? styles.tileBig : ''}`}
      onClick={onOpen}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.035, duration: 0.24 }}
      whileHover={{ scale: 1.035, y: -3 }}
      whileTap={{ scale: 0.97 }}
      title={game.how}
    >
      <span className={styles.tileIcon}>{game.icon}</span>
      <span className={styles.tileTitle}>{game.title}</span>
      <span className={styles.tileHow}>{game.how}</span>

      <span className={styles.tileMeta}>
        <span className={styles.verb}>{ENGINE_VERBS[game.engine]}</span>
        {game.lifeSkillLabel && <span className={styles.life}>{game.lifeSkillLabel}</span>}
      </span>

      <span className={styles.tileFoot}>
        <span className={styles.domainChips}>
          {domains.map((d) => (
            <span key={d} className={styles.chip}>
              {d}
            </span>
          ))}
        </span>
        <span className={styles.tileProgress}>
          {st.trials > 0 ? (
            <>
              <span className={styles.stage} title={PROMPT_INFO[next?.promptStage]?.help}>
                {next?.promptStage || 'A'}
              </span>
              <span className={styles.stars}>
                {[1, 2, 3].map((s) => (
                  <FaStar key={s} className={s <= stars ? styles.starOn : styles.starOff} />
                ))}
              </span>
            </>
          ) : (
            <span className={styles.newBadge}>New</span>
          )}
        </span>
      </span>
    </FramerMotion.motion.button>
  )
}

function starsFromHistory(st) {
  const last = (st.history || []).slice(-3)
  if (!last.length) return 0
  const best = Math.max(...last.map((h) => h.stars ?? 0))
  return Number.isFinite(best) ? best : 0
}

/**
 * What to suggest next. Deliberately simple and explainable — an adult should
 * be able to see why the app suggested this, and disagree with it.
 */
function pickRecommended() {
  const profile = loadProfile()
  const settings = getSettings()

  // 1. A game already in progress but not yet independent.
  const inProgress = GAMES.filter((g) => {
    const st = profile.games?.[g.id]
    return st && st.trials > 4 && ['A', 'B', 'C'].includes(st.promptStage || 'A')
  })
  if (inProgress.length) {
    const g = inProgress[inProgress.length - 1]
    return { game: g, stage: profile.games[g.id].promptStage, reason: 'Carry on where you left off' }
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
        stage: profile.games?.[candidate.id]?.promptStage || 'A',
        reason: `Practising ${(DOMAIN_LABELS[domain] || domain).toLowerCase()}`,
      }
    }
  }

  // 3. Nothing played yet — start with something that always works.
  const unplayed = GAMES.filter((g) => g.featured && !profile.games?.[g.id])
  if (unplayed.length) {
    return { game: unplayed[0], stage: 'A', reason: 'Try something new' }
  }
  void settings
  return null
}

