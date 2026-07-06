import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
import DashboardView from './DashboardView'
import { FaExclamationTriangle } from 'react-icons/fa'

// ── Main Dashboard (Redux-connected wrapper for the logged-in student) ─────────
export default function Dashboard() {
  const dispatch  = useDispatch()
  const { user }  = useAuth()
  const { t }     = useTranslation()
  const { stats, activity, achievements, performance, answers, rounds, status, error } = useSelector(s => s.dashboard)

  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
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

  function handleRetry() {
    dispatch(fetchDashboardStats())
    dispatch(fetchDashboardActivity({ year: selectedYear }))
    dispatch(fetchDashboardAchievements())
    dispatch(fetchDashboardPerformance(30))
  }

  function handleOpenResults() {
    dispatch(fetchDashboardAnswers(50))
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'

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

  return (
    <DashboardView
      stats={stats}
      activity={activity}
      achievements={achievements}
      performance={performance}
      rounds={rounds}
      answers={answers}
      status={status}
      error={error}
      selectedYear={selectedYear}
      yearOptions={yearOptions}
      onYearChange={handleYearChange}
      onRetry={handleRetry}
      onOpenResults={handleOpenResults}
      displayName={firstName}
      avatarUrl={user?.photoURL}
    />
  )
}
