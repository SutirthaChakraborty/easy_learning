import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import {
  fetchDashboardStats,
  fetchDashboardActivity,
  fetchDashboardAchievements,
  fetchDashboardPerformance,
  fetchDashboardAnswers,
  fetchRounds,
} from '../store/slices/dashboardSlice'
import styles from './Dashboard.module.css'
import ProgressMap from './ProgressMap'
import {
  FaLock, FaBook, FaGamepad, FaFire, FaBolt, FaMagic,
  FaExclamationTriangle, FaChartBar, FaMap, FaBookOpen,
  FaClock, FaMedal, FaChartLine, FaSeedling, FaCalendarAlt,
  FaCheckCircle, FaTrophy, FaBullseye, FaTimes, FaStar, FaRegStar,
} from 'react-icons/fa'
import { GiCrossedSwords } from 'react-icons/gi'


// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtMinutes(mins) {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Heatmap component ──────────────────────────────────────────────────────────
function localDateStr(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ActivityHeatmap({ activity, selectedYear }) {
  const { t } = useTranslation()
  const thisYear = new Date().getFullYear()

  const cellData = useMemo(() => {
    const map = {}
    activity.forEach(a => {
      const key = localDateStr(a.date)
      map[key] = { xp: a.totalXP, minutes: a.totalMinutes }
    })

    const start = new Date(selectedYear, 0, 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    if (selectedYear < thisYear) {
      end.setFullYear(selectedYear, 11, 31)
    }

    const cells = []
    const d = new Date(start)
    while (d <= end) {
      const key = localDateStr(d)
      cells.push({ date: key, ...(map[key] || { xp: 0, minutes: 0 }) })
      d.setDate(d.getDate() + 1)
    }
    return cells
  }, [activity, selectedYear, thisYear])

  const maxXP = useMemo(() => Math.max(...cellData.map(c => c.xp), 1), [cellData])

  function getColor(xp) {
    if (!xp) return 'var(--heat-0)'
    const ratio = xp / maxXP
    if (ratio < 0.25) return 'var(--heat-1)'
    if (ratio < 0.5)  return 'var(--heat-2)'
    if (ratio < 0.75) return 'var(--heat-3)'
    return 'var(--heat-4)'
  }

  const weeks = []
  for (let i = 0; i < cellData.length; i += 7) {
    weeks.push(cellData.slice(i, i + 7))
  }

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = null
    weeks.forEach((week, wi) => {
      const month = new Date(week[0].date).toLocaleString('en', { month: 'short' })
      if (month !== lastMonth) { labels.push({ wi, month }); lastMonth = month }
    })
    return labels
  }, [weeks])

  const [tooltip, setTooltip] = useState(null)

  return (
    <div className={styles.heatmapWrapper}>
      <div className={styles.heatmapMonths}>
        {monthLabels.map(({ wi, month }) => (
          <span key={wi} style={{ gridColumn: wi + 1 }}>{month}</span>
        ))}
      </div>
      <div className={styles.heatmapGrid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.heatmapCol}>
            {week.map((cell) => (
              <div
                key={cell.date}
                className={styles.heatCell}
                style={{ background: getColor(cell.xp) }}
                onMouseEnter={(e) => setTooltip({ cell, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className={styles.heatTooltip}
          style={{ top: tooltip.y - 60, left: tooltip.x - 80 }}
        >
          <strong>{tooltip.cell.date}</strong>
          <span>{tooltip.cell.xp} XP · {fmtMinutes(tooltip.cell.minutes)}</span>
        </div>
      )}

      <div className={styles.heatLegend}>
        <span>{t('dashboard.heatmap.less')}</span>
        {['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'].map((c, i) => (
          <div key={i} className={styles.heatLegendCell} style={{ background: c }} />
        ))}
        <span>{t('dashboard.heatmap.more')}</span>
      </div>
    </div>
  )
}

// ── Achievement Badge ──────────────────────────────────────────────────────────
function AchievementBadge({ ach }) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)

  const name = t(`dashboard.achievements.${ach.id}.name`, { defaultValue: ach.name })
  const description = t(`dashboard.achievements.${ach.id}.description`, { defaultValue: ach.description })

  return (
    <div
      className={`${styles.badge} ${ach.earned ? styles.badgeEarned : styles.badgeLocked}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={styles.badgeIcon}>{ach.earned ? ach.icon : <FaLock />}</span>
      <span className={styles.badgeName}>{name}</span>
      {hover && (
        <div className={styles.badgeTooltip}>
          <strong>{name}</strong>
          <p>{description}</p>
          {ach.earned && ach.earnedAt && (
            <small>{t('dashboard.achievements.earnedOn', { date: fmtDate(ach.earnedAt) })}</small>
          )}
          {!ach.earned && <small>{t('dashboard.achievements.xpReward', { xp: ach.xp })}</small>}
        </div>
      )}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <motion.div
      className={styles.statCard}
      style={{ '--card-color': color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </motion.div>
  )
}

// ── Custom Chart Tooltip ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.chartTooltip}>
      <strong>{label}</strong>
      <span>{payload[0].value} XP</span>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const dispatch  = useDispatch()
  const { user }  = useAuth()
  const { t }     = useTranslation()
  const { stats, activity, achievements, performance, answers, rounds, status, error } = useSelector(s => s.dashboard)

  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
  const [showProgressMap, setShowProgressMap] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState('practice')
  const yearOptions = Array.from({ length: 5 }, (_, i) => thisYear - i)

  useEffect(() => {
    if (!user) return
    dispatch(fetchDashboardStats())
    dispatch(fetchDashboardActivity({ year: selectedYear }))
    dispatch(fetchDashboardAchievements())
    dispatch(fetchDashboardPerformance(30))
    dispatch(fetchRounds(30))
  }, [dispatch, user])

  function handleYearChange(year) {
    setSelectedYear(year)
    dispatch(fetchDashboardActivity({ year }))
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'

  const chartData = useMemo(() =>
    performance.map(p => ({
      date: fmtDate(p.date),
      xp:   p.totalXP,
      mins: p.totalMinutes,
    })),
  [performance])

  const earnedCount  = achievements.filter(a => a.earned).length
  const totalCount   = achievements.length
  const levelProgress = stats ? ((stats.totalXP % 100) / 100) * 100 : 0

  const catIcons = {
    learning: FaBook,
    games:    FaGamepad,
    streak:   FaFire,
    xp:       FaBolt,
    special:  FaMagic,
  }

  // Auth still resolving
  if (user === undefined) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>{t('dashboard.loading')}</p>
      </div>
    )
  }

  // Definitely not logged in
  if (user === null) {
    return (
      <div className={styles.loadingWrap}>
        <p className={styles.errorMsg}><FaExclamationTriangle /> {t('dashboard.loginPrompt')}</p>
      </div>
    )
  }

  if (status === 'loading' && !stats) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>{t('dashboard.loadingDashboard')}</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.loadingWrap}>
        <p className={styles.errorMsg}><FaExclamationTriangle /> {t('dashboard.serverError')}</p>
        <p style={{ color: '#6272a4', fontSize: '0.9rem', marginTop: 4 }}>{error || t('dashboard.serverErrorHint')}</p>
        <button
          onClick={() => {
            dispatch(fetchDashboardStats())
            dispatch(fetchDashboardActivity({ year: selectedYear }))
            dispatch(fetchDashboardAchievements())
            dispatch(fetchDashboardPerformance(30))
          }}
          className={styles.retryBtn}
        >
          {t('dashboard.retry')}
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className={styles.dashboard}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" />
              : <span>{firstName[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <h1 className={styles.greeting}>{t('dashboard.welcomeBack', { name: firstName })}</h1>
            <p className={styles.subGreeting}>{t('dashboard.motivational')}</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.progressMapBtn}
            onClick={() => { setActiveTab('practice'); setShowResults(true); dispatch(fetchDashboardAnswers(50)); }}
          >
            <FaChartBar /> Results
          </button>
          <button
            className={styles.progressMapBtn}
            onClick={() => setShowProgressMap(true)}
          >
            <FaMap /> {t('dashboard.progressMap.btnLabel')}
          </button>
          <div className={styles.levelBadge}>
            <div className={styles.levelLabel}>{t('dashboard.level', { level: stats?.level ?? 1 })}</div>
            <div className={styles.levelBar}>
              <div className={styles.levelFill} style={{ width: `${levelProgress}%` }} />
            </div>
            <div className={styles.levelXP}>{t('dashboard.xpTotal', { xp: stats?.totalXP ?? 0 })}</div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsRow}>
        <StatCard
          icon={<FaBolt />}
          label={t('dashboard.stats.totalXP')}
          value={`${stats?.totalXP ?? 0} XP`}
          color="#6c63ff"
        />
        <StatCard
          icon={<FaBookOpen />}
          label={t('dashboard.stats.sessions')}
          value={stats?.totalSessions ?? 0}
          sub={t('dashboard.stats.lessonsCompleted')}
          color="#43c0a0"
        />
        <StatCard
          icon={<FaClock />}
          label={t('dashboard.stats.todayTime')}
          value={fmtMinutes(stats?.todayMinutes ?? 0)}
          sub={stats?.peakTimeLabel
            ? t('dashboard.stats.peakTime', { time: stats.peakTimeLabel })
            : t('dashboard.stats.noSessions')}
          color="#f7971e"
        />
        <StatCard
          icon={<FaFire />}
          label={t('dashboard.stats.streak')}
          value={t('dashboard.stats.streakDays', { count: stats?.streak ?? 0 })}
          sub={stats?.streak >= 3 ? t('dashboard.stats.onFire') : t('dashboard.stats.keepGoing')}
          color="#e74c3c"
        />
        <StatCard
          icon={<FaMedal />}
          label={t('dashboard.stats.achievements')}
          value={`${earnedCount} / ${totalCount}`}
          sub={t('dashboard.stats.badgesEarned')}
          color="#3498db"
        />
      </div>

      {/* ── Performance Chart ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FaChartLine /> {t('dashboard.performance.title')}</h2>
        {chartData.length === 0 ? (
          <div className={styles.emptyChart}>
            <span><FaSeedling /></span>
            <p>{t('dashboard.performance.empty')}</p>
          </div>
        ) : (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#a8b2d8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#a8b2d8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#6c63ff"
                  strokeWidth={2.5}
                  fill="url(#xpGrad)"
                  dot={{ r: 4, fill: '#6c63ff', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Activity Heatmap ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaCalendarAlt /> {selectedYear === thisYear
              ? t('dashboard.heatmap.titleCurrent', { year: selectedYear })
              : t('dashboard.heatmap.titlePast', { year: selectedYear })}
          </h2>
          <div className={styles.heatControls}>
            <div className={styles.heatStats}>
              <span className={styles.heatStat}>
                <span className={styles.heatDot} style={{ background: 'var(--heat-4)' }} />
                {t('dashboard.heatmap.activeDays', { count: activity.length })}
              </span>
              {selectedYear === thisYear && stats?.peakTimeLabel && (
                <span className={styles.heatStat}>
                  <FaClock /> {t('dashboard.heatmap.mostActive', { time: stats.peakTimeLabel })}
                </span>
              )}
              {selectedYear === thisYear && stats?.todayMinutes > 0 && (
                <span className={styles.heatStat}>
                  <FaCheckCircle /> {t('dashboard.heatmap.today', { time: fmtMinutes(stats.todayMinutes) })}
                </span>
              )}
            </div>
            <select
              className={styles.yearSelect}
              value={selectedYear}
              onChange={e => handleYearChange(Number(e.target.value))}
              aria-label="Select year"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <ActivityHeatmap activity={activity} selectedYear={selectedYear} />
      </div>

      {/* ── Achievements ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FaTrophy /> {t('dashboard.achievements.title')}</h2>
        {achievements.length === 0 ? (
          <div className={styles.emptyChart}>
            <span><FaBullseye /></span>
            <p>{t('dashboard.achievements.empty')}</p>
          </div>
        ) : (
          <>
            {['learning', 'games', 'streak', 'xp', 'special'].map(cat => {
              const catAchs = achievements.filter(a => a.category === cat)
              if (!catAchs.length) return null
              const CatIcon = catIcons[cat]
              return (
                <div key={cat} className={styles.achieveCat}>
                  <h3 className={styles.catTitle}><CatIcon /> {t(`dashboard.achievements.categories.${cat}`)}</h3>
                  <div className={styles.badgeGrid}>
                    {catAchs.map(ach => <AchievementBadge key={ach.id} ach={ach} />)}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── Round History ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FaTrophy /> Round History</h2>
        {rounds.length === 0 ? (
          <div className={styles.emptyChart}>
            <span><FaBullseye /></span>
            <p>No rounds completed yet. Finish a module round to see your results here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rounds.map((r, i) => (
              <motion.div
                key={r._id || i}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  borderLeft: `4px solid ${r.mode === 'warrior' ? (r.passed ? '#FFD700' : '#e74c3c') : '#6c63ff'}`,
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div style={{ minWidth: 80 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {r.module} · {r.subject}
                  </span>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.mode === 'warrior'
                      ? <GiCrossedSwords color={r.passed ? '#FFD700' : '#e74c3c'} />
                      : <FaBook color="#6c63ff" />
                    }
                    <span style={{ color: r.mode === 'warrior' ? (r.passed ? '#FFD700' : '#e74c3c') : '#a29bfe', fontWeight: 700, fontSize: '0.85rem' }}>
                      {r.mode === 'warrior' ? (r.passed ? 'PASSED' : 'FAILED') : 'Practice'}
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                    {Array.from({ length: 10 }).map((_, si) => (
                      si < r.stars
                        ? <FaStar key={si} color="#FFD700" style={{ fontSize: '0.85rem' }} />
                        : <FaRegStar key={si} color="rgba(255,255,255,0.2)" style={{ fontSize: '0.85rem' }} />
                    ))}
                    <span style={{ color: '#FFD700', fontWeight: 700, marginLeft: 6, fontSize: '0.9rem' }}>{r.stars}/10</span>
                  </div>
                  {r.bonusStars > 0 && (
                    <span style={{ color: '#a29bfe', fontSize: '0.78rem', fontWeight: 600 }}>
                      +{r.bonusStars} speed bonus · {r.totalStars} total stars
                    </span>
                  )}
                </div>

                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {new Date(r.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Results modal ── */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowResults(false)}
          >
            <motion.div
              style={{ background: 'linear-gradient(135deg,#1a1a3e,#16213e)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }}
            >
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}><FaChartBar /> My Answers</h2>
                  <button onClick={() => setShowResults(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.9rem' }}><FaTimes /> Close</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setActiveTab('practice')}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
                      background: activeTab === 'practice' ? '#6c63ff' : 'rgba(255,255,255,0.07)',
                      color: activeTab === 'practice' ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <FaBook style={{ marginRight: 6 }} /> Practice
                  </button>
                  <button
                    onClick={() => setActiveTab('warrior')}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
                      background: activeTab === 'warrior' ? '#e74c3c' : 'rgba(255,255,255,0.07)',
                      color: activeTab === 'warrior' ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    ⚔️ Warrior
                  </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '12px 16px', flex: 1 }}>
                {(() => {
                  const filtered = answers.filter(a => activeTab === 'warrior' ? a.mode === 'warrior' : a.mode !== 'warrior')
                  if (filtered.length === 0) return (
                    <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 }}>
                      {activeTab === 'warrior' ? 'No warrior mode answers yet. Try warrior mode!' : 'No practice answers recorded yet. Play some modules!'}
                    </p>
                  )
                  return filtered.map((a, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', marginBottom: 8, borderLeft: `4px solid ${a.correct ? '#43c0a0' : '#e74c3c'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {a.module} · {a.subject}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                          {new Date(a.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', margin: '0 0 6px', fontWeight: 500 }}>{a.question}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.83rem', color: a.correct ? '#43c0a0' : '#e74c3c', fontWeight: 600 }}>
                          {a.correct ? '✓' : '✗'} You: {a.userAnswer || '—'}
                        </span>
                        {!a.correct && (
                          <span style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)' }}>
                            Answer: {a.correctAnswer}
                          </span>
                        )}
                        {a.xpEarned > 0 && (
                          <span style={{ fontSize: '0.8rem', color: '#f7971e' }}>+{a.xpEarned} XP</span>
                        )}
                        {activeTab === 'warrior' && a.timeTaken != null && (
                          <span style={{
                            fontSize: '0.8rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                            background: a.timeTaken <= 10 ? 'rgba(46,204,113,0.15)' : a.timeTaken <= 20 ? 'rgba(243,156,18,0.15)' : 'rgba(231,76,60,0.15)',
                            color: a.timeTaken <= 10 ? '#2ecc71' : a.timeTaken <= 20 ? '#f39c12' : '#e74c3c',
                            border: `1px solid ${a.timeTaken <= 10 ? 'rgba(46,204,113,0.35)' : a.timeTaken <= 20 ? 'rgba(243,156,18,0.35)' : 'rgba(231,76,60,0.35)'}`,
                          }}>
                            ⏱ {a.timeTaken}s
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress Map modal ── */}
      <AnimatePresence>
        {showProgressMap && (
          <ProgressMap
            achievements={achievements}
            stats={stats}
            onClose={() => setShowProgressMap(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
