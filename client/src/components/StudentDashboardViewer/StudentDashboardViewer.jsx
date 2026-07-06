import { useCallback, useEffect, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import DashboardView from '../../pages/DashboardView'

// Read-only "view as student" dashboard, used by the admin and super-admin
// dashboards to show a student's real Learningo dashboard (same data/UI the
// student sees) once that student is confirmed to exist in the learning DB.
export default function StudentDashboardViewer({ apiBase, token, displayName, onClose }) {
  const thisYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)
  const yearOptions = Array.from({ length: 5 }, (_, i) => thisYear - i)

  const [data, setData] = useState({
    stats: null, activity: [], achievements: [], performance: [], rounds: [], answers: [],
    status: 'idle', error: null,
  })

  const fetchJSON = useCallback(async (path) => {
    const r = await fetch(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await r.json()
    if (!json.success) throw new Error(json.message || 'Request failed')
    return json.data
  }, [apiBase, token])

  const loadAll = useCallback(async (year) => {
    setData(d => ({ ...d, status: 'loading', error: null }))
    try {
      const [stats, activity, achievements, performance, rounds] = await Promise.all([
        fetchJSON('/stats'),
        fetchJSON(`/activity?year=${year}`),
        fetchJSON('/achievements'),
        fetchJSON('/performance?days=30'),
        fetchJSON('/rounds?limit=30'),
      ])
      setData(d => ({ ...d, stats, activity, achievements, performance, rounds, status: 'succeeded' }))
    } catch (err) {
      setData(d => ({ ...d, status: 'failed', error: err.message }))
    }
  }, [fetchJSON])

  useEffect(() => { loadAll(selectedYear) }, [loadAll])

  async function handleYearChange(year) {
    setSelectedYear(year)
    try {
      const activity = await fetchJSON(`/activity?year=${year}`)
      setData(d => ({ ...d, activity }))
    } catch (err) {
      setData(d => ({ ...d, status: 'failed', error: err.message }))
    }
  }

  async function handleOpenResults() {
    try {
      const answers = await fetchJSON('/answers?limit=50')
      setData(d => ({ ...d, answers }))
    } catch { /* results panel just stays empty */ }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, overflowY: 'auto' }}>
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 501,
          background: 'rgba(20,20,40,0.85)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
          fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <FaTimes /> Close
      </button>
      <DashboardView
        stats={data.stats}
        activity={data.activity}
        achievements={data.achievements}
        performance={data.performance}
        rounds={data.rounds}
        answers={data.answers}
        status={data.status}
        error={data.error}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onYearChange={handleYearChange}
        onRetry={() => loadAll(selectedYear)}
        onOpenResults={handleOpenResults}
        displayName={displayName}
        avatarUrl={null}
        disableProgressMapPersistence
      />
    </div>
  )
}
