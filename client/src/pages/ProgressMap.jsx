import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import styles from './ProgressMap.module.css'
import { FaBookOpen, FaPencilAlt, FaMicrophone, FaMap, FaTimes, FaStar, FaRegStar } from 'react-icons/fa'
import { MdHearing } from 'react-icons/md'

// ── Static data ─────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { key: 'english', label: 'English', color: '#4a90d9' },
  { key: 'maths',   label: 'Maths',   color: '#e05252' },
  { key: 'science', label: 'Science', color: '#e8a020' },
]

const MODULES = [
  { key: 'listen', Icon: MdHearing,    achievementId: 'sharp_ears'     },
  { key: 'read',   Icon: FaBookOpen,   achievementId: 'bookworm'       },
  { key: 'write',  Icon: FaPencilAlt,  achievementId: 'penpal'         },
  { key: 'speak',  Icon: FaMicrophone, achievementId: 'public_speaker' },
]

// 12 ordered levels: english×4 → maths×4 → science×4
const LEVELS = SUBJECTS.flatMap((subj, si) =>
  MODULES.map((mod, mi) => ({
    id:            si * 4 + mi + 1,
    subject:       subj.key,
    subjectLabel:  subj.label, 
    module:        mod.key,
    moduleLabel:   mod.key.charAt(0).toUpperCase() + mod.key.slice(1),
    Icon:          mod.Icon,
    color:         subj.color,
    achievementId: mod.achievementId,
  }))
)

// Node positions as % of container (x: left, y: top)
// Vertical layout — portrait / mobile
const VERT_POS = [
  { x: 20, y: 89 },
  { x: 60, y: 81 },
  { x: 78, y: 71 },
  { x: 52, y: 62 },
  { x: 18, y: 53 },
  { x: 48, y: 44 },
  { x: 74, y: 35 },
  { x: 26, y: 26 },
  { x: 60, y: 17 },
  { x: 18, y: 9  },
  { x: 50, y: 3  },
  { x: 78, y: 10 },
]

// Horizontal layout — landscape / desktop + tablet
const HORIZ_POS = [
  { x: 4,  y: 72 },
  { x: 13, y: 25 },
  { x: 22, y: 68 },
  { x: 32, y: 22 },
  { x: 42, y: 62 },
  { x: 51, y: 18 },
  { x: 59, y: 62 },
  { x: 68, y: 22 },
  { x: 77, y: 68 },
  { x: 85, y: 25 },
  { x: 91, y: 65 },
  { x: 97, y: 38 },
]

// ── Stars sub-component ─────────────────────────────────────────────────────────

function Stars({ count }) {
  return (
    <div className={styles.stars}>
      {[0, 1, 2].map(i => (
        <span key={i} className={i < count ? styles.starOn : styles.starOff}>
          {i < count ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────

export default function ProgressMap({ achievements, stats, onClose }) {
  const { t }    = useTranslation()
  const { user } = useAuth()

  // Orientation: horizontal = landscape screens ≥ 768 px wide
  const [isHoriz, setIsHoriz] = useState(
    () => window.innerWidth >= 768 && window.innerWidth > window.innerHeight
  )

  useEffect(() => {
    function check() {
      setIsHoriz(window.innerWidth >= 768 && window.innerWidth > window.innerHeight)
    }
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // Close on Escape; lock body scroll
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Persist progress to localStorage whenever props change
  const storageKey = `progressMap_${user?.uid || user?.email || 'guest'}`

  useEffect(() => {
    if (!achievements?.length && !stats) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        achievements,
        stats,
        savedAt: Date.now(),
      }))
    } catch { /* quota exceeded — silently skip */ }
  }, [achievements, stats, storageKey])

  // Load saved data as fallback when live data is absent
  const [saved] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const liveAchievements = achievements?.length ? achievements : (saved?.achievements ?? [])
  const liveStats        = stats ?? saved?.stats ?? {}

  // ── Derived status ────────────────────────────────────────────────────────────

  const earnedIds = useMemo(
    () => new Set(liveAchievements.filter(a => a.earned).map(a => a.id)),
    [liveAchievements]
  )

  const getLevelStatus = useCallback((level) => {
    if (earnedIds.has(level.achievementId)) return 'mastered'
    const sessions = liveStats?.totalSessions ?? 0
    // First session unlocks the first 2 levels; each subsequent session +1
    const unlocked = Math.min(Math.max(sessions + 1, 1), LEVELS.length)
    if (level.id <= unlocked) return 'active'
    return 'locked'
  }, [earnedIds, liveStats])

  const getLevelStars = useCallback((level) => {
    const s = getLevelStatus(level)
    if (s === 'mastered') return 3
    if (s === 'active') {
      const sessions = liveStats?.totalSessions ?? 0
      return sessions >= level.id * 2 ? 2 : 1
    }
    return 0
  }, [getLevelStatus, liveStats])

  // Current = first active (non-mastered started) level
  const currentLevelId = useMemo(() => {
    const first = LEVELS.find(l => getLevelStatus(l) === 'active')
    return first?.id ?? 1
  }, [getLevelStatus])

  const masteredCount  = LEVELS.filter(l => getLevelStatus(l) === 'mastered').length
  const progressPct    = Math.round((masteredCount / LEVELS.length) * 100)
  const positions      = isHoriz ? HORIZ_POS : VERT_POS

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className={`${styles.modal} ${isHoriz ? styles.modalH : styles.modalV}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('dashboard.progressMap.title')}
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}><FaMap /> {t('dashboard.progressMap.title')}</h2>
            <p className={styles.subtitle}>
              {t('dashboard.progressMap.subtitle', {
                completed: masteredCount,
                total:     LEVELS.length,
              })}
            </p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('dashboard.progressMap.close')}
          >
            <FaTimes />
          </button>
        </div>

        {/* ── Map area ── */}
        <div className={`${styles.mapScroll} ${isHoriz ? styles.mapScrollH : styles.mapScrollV}`}>
          <div className={`${styles.mapField} ${isHoriz ? styles.mapFieldH : styles.mapFieldV}`}>

            {/* Dashed connecting path (SVG) */}
            <svg
              className={styles.svgLines}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {positions.slice(0, -1).map((pos, i) => {
                const next  = positions[i + 1]
                const done  = getLevelStatus(LEVELS[i]) === 'mastered'
                return (
                  <line
                    key={i}
                    x1={pos.x}  y1={pos.y}
                    x2={next.x} y2={next.y}
                    stroke={done ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)'}
                    strokeWidth="1.4"
                    strokeDasharray="4 2.5"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>

            {/* Level nodes */}
            {LEVELS.map((level, i) => {
              const pos       = positions[i]
              const status    = getLevelStatus(level)
              const stars     = getLevelStars(level)
              const isCurrent = level.id === currentLevelId
              const NodeIcon  = level.Icon

              return (
                <motion.div
                  key={level.id}
                  className={`${styles.nodeWrap} ${isCurrent ? styles.nodeWrapCurrent : ''}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.28, ease: 'backOut' }}
                  title={`${level.subjectLabel} – ${level.moduleLabel}`}
                >
                  {/* Stars sit above the circle (like the reference) */}
                  <Stars count={stars} />

                  <div
                    className={`${styles.nodeCircle} ${styles['node_' + status]} ${isCurrent ? styles.nodeCurrent : ''}`}
                    style={{ '--nc': level.color }}
                  >
                    <span className={styles.nodeIcon}><NodeIcon /></span>
                    <span className={styles.nodeNum}>{level.id}</span>
                  </div>

                  {/* Pulsing ring for the current level */}
                  {isCurrent && <span className={styles.pulseRing} />}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Legend ── */}
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotMastered}`} />
            {t('dashboard.progressMap.completed')}
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotActive}`} />
            {t('dashboard.progressMap.inProgress')}
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotLocked}`} />
            {t('dashboard.progressMap.locked')}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
