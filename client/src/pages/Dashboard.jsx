import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import {
  fetchDashboardStats,
  fetchDashboardActivity,
  fetchDashboardAchievements,
  fetchDashboardPerformance,
} from '../store/slices/dashboardSlice'
import styles from './Dashboard.module.css'

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

  // Split into weeks (columns of 7)
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
        <span>Less</span>
        {['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'].map((c, i) => (
          <div key={i} className={styles.heatLegendCell} style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ── Achievement Badge ──────────────────────────────────────────────────────────
function AchievementBadge({ ach }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      className={`${styles.badge} ${ach.earned ? styles.badgeEarned : styles.badgeLocked}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={styles.badgeIcon}>{ach.earned ? ach.icon : '🔒'}</span>
      <span className={styles.badgeName}>{ach.name}</span>
      {hover && (
        <div className={styles.badgeTooltip}>
          <strong>{ach.name}</strong>
          <p>{ach.description}</p>
          {ach.earned && ach.earnedAt && (
            <small>Earned {fmtDate(ach.earnedAt)}</small>
          )}
          {!ach.earned && <small>+{ach.xp} XP on unlock</small>}
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
  const { stats, activity, achievements, performance, status } = useSelector(s => s.dashboard)

  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
  const yearOptions = Array.from({ length: 5 }, (_, i) => thisYear - i)

  useEffect(() => {
    // user===undefined means auth hasn't resolved yet; null means logged out
    if (!user) return
    dispatch(fetchDashboardStats())
    dispatch(fetchDashboardActivity({ year: selectedYear }))
    dispatch(fetchDashboardAchievements())
    dispatch(fetchDashboardPerformance(30))
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

  // Auth still resolving
  if (user === undefined) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Loading…</p>
      </div>
    )
  }

  // Definitely not logged in
  if (user === null) {
    return (
      <div className={styles.loadingWrap}>
        <p className={styles.errorMsg}>⚠️ Please log in to view your dashboard.</p>
      </div>
    )
  }

  if (status === 'loading' && !stats) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Loading your dashboard…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.loadingWrap}>
        <p className={styles.errorMsg}>⚠️ Could not connect to the server.</p>
        <p style={{ color: '#6272a4', fontSize: '0.9rem', marginTop: 4 }}>
          Make sure the backend is running, then refresh the page.
        </p>
        <button
          onClick={() => {
            dispatch(fetchDashboardStats())
            dispatch(fetchDashboardActivity(365))
            dispatch(fetchDashboardAchievements())
            dispatch(fetchDashboardPerformance(30))
          }}
          className={styles.retryBtn}
        >
          Retry
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
            <h1 className={styles.greeting}>Welcome back, {firstName}! 👋</h1>
            <p className={styles.subGreeting}>Keep up the great work — every lesson counts.</p>
          </div>
        </div>

        <div className={styles.levelBadge}>
          <div className={styles.levelLabel}>Level {stats?.level ?? 1}</div>
          <div className={styles.levelBar}>
            <div className={styles.levelFill} style={{ width: `${levelProgress}%` }} />
          </div>
          <div className={styles.levelXP}>{stats?.totalXP ?? 0} XP total</div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsRow}>
        <StatCard
          icon="⚡"
          label="Total XP"
          value={`${stats?.totalXP ?? 0} XP`}
          color="#6c63ff"
        />
        <StatCard
          icon="📖"
          label="Sessions"
          value={stats?.totalSessions ?? 0}
          sub="lessons completed"
          color="#43c0a0"
        />
        <StatCard
          icon="⏱️"
          label="Today's Time"
          value={fmtMinutes(stats?.todayMinutes ?? 0)}
          sub={stats?.peakTimeLabel ? `Peak: ${stats.peakTimeLabel}` : 'No sessions yet'}
          color="#f7971e"
        />
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${stats?.streak ?? 0} days`}
          sub={stats?.streak >= 3 ? 'On fire! 🔥' : 'Keep going!'}
          color="#e74c3c"
        />
        <StatCard
          icon="🏅"
          label="Achievements"
          value={`${earnedCount} / ${totalCount}`}
          sub="badges earned"
          color="#3498db"
        />
      </div>

      {/* ── Performance Chart ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📈 Performance — Last 30 Days</h2>
        {chartData.length === 0 ? (
          <div className={styles.emptyChart}>
            <span>🌱</span>
            <p>No activity yet — complete a lesson to see your progress here!</p>
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
            🗓️ Activity Heatmap —{' '}
            {selectedYear === thisYear ? `${thisYear} (So Far)` : selectedYear}
          </h2>
          <div className={styles.heatControls}>
            <div className={styles.heatStats}>
              <span className={styles.heatStat}>
                <span className={styles.heatDot} style={{ background: 'var(--heat-4)' }} />
                {activity.length} active days
              </span>
              {selectedYear === thisYear && stats?.peakTimeLabel && (
                <span className={styles.heatStat}>
                  ⏰ Most active {stats.peakTimeLabel}
                </span>
              )}
              {selectedYear === thisYear && stats?.todayMinutes > 0 && (
                <span className={styles.heatStat}>
                  ✅ Today: {fmtMinutes(stats.todayMinutes)}
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
        <h2 className={styles.sectionTitle}>🏆 Achievements</h2>
        {achievements.length === 0 ? (
          <div className={styles.emptyChart}>
            <span>🎯</span>
            <p>Complete lessons to unlock achievements!</p>
          </div>
        ) : (
          <>
            {['learning', 'games', 'streak', 'xp', 'special'].map(cat => {
              const catAchs = achievements.filter(a => a.category === cat)
              if (!catAchs.length) return null
              const catLabel = { learning: '📚 Learning', games: '🎮 Games', streak: '🔥 Streak', xp: '⚡ XP Milestones', special: '✨ Special' }[cat]
              return (
                <div key={cat} className={styles.achieveCat}>
                  <h3 className={styles.catTitle}>{catLabel}</h3>
                  <div className={styles.badgeGrid}>
                    {catAchs.map(ach => <AchievementBadge key={ach.id} ach={ach} />)}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </motion.div>
  )
}
