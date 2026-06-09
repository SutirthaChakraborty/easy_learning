import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const BASE = import.meta.env.VITE_API_BASE_URL

function authHeaders() {
  const token = localStorage.getItem('jwt_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', headers: authHeaders(), ...options })
  if (!res.ok) {
    const text = await res.text()
    let msg = `HTTP ${res.status}`
    try { msg = JSON.parse(text).message || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const json = await apiFetch(`${BASE}/dashboard/stats`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const fetchDashboardActivity = createAsyncThunk(
  'dashboard/fetchActivity',
  async (params = {}, { rejectWithValue }) => {
    try {
      const qs = typeof params === 'number'
        ? `days=${params}`
        : params.year
          ? `year=${params.year}`
          : `days=${params.days || 365}`
      const json = await apiFetch(`${BASE}/dashboard/activity?${qs}`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const fetchDashboardAchievements = createAsyncThunk(
  'dashboard/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const json = await apiFetch(`${BASE}/dashboard/achievements`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const fetchDashboardPerformance = createAsyncThunk(
  'dashboard/fetchPerformance',
  async (days = 30, { rejectWithValue }) => {
    try {
      const json = await apiFetch(`${BASE}/dashboard/performance?days=${days}`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const logDashboardAnswer = createAsyncThunk(
  'dashboard/logAnswer',
  async (answerData, { rejectWithValue }) => {
    try {
      return await apiFetch(`${BASE}/dashboard/log-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(answerData),
      })
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const fetchDashboardAnswers = createAsyncThunk(
  'dashboard/fetchAnswers',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const json = await apiFetch(`${BASE}/dashboard/answers?limit=${limit}`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const fetchModuleStars = createAsyncThunk(
  'dashboard/fetchModuleStars',
  async (_, { rejectWithValue }) => {
    try {
      const json = await apiFetch(`${BASE}/dashboard/module-stars`)
      return json.data
    } catch (e) { return rejectWithValue(e.message) }
  }
)

export const logDashboardSession = createAsyncThunk(
  'dashboard/logSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      return await apiFetch(`${BASE}/dashboard/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(sessionData),
      })
    } catch (e) { return rejectWithValue(e.message) }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    activity: [],
    achievements: [],
    performance: [],
    moduleStars: {},
    answers: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const loading = (state) => { state.status = 'loading'; state.error = null }
    const failed  = (state, action) => { state.status = 'failed'; state.error = action.payload }

    builder
      .addCase(fetchDashboardStats.pending,        loading)
      .addCase(fetchDashboardStats.rejected,       failed)
      .addCase(fetchDashboardStats.fulfilled,      (state, { payload }) => {
        state.status = 'succeeded'
        state.stats = payload
      })
      .addCase(fetchDashboardActivity.fulfilled,   (state, { payload }) => { state.activity = payload })
      .addCase(fetchDashboardAchievements.fulfilled, (state, { payload }) => { state.achievements = payload })
      .addCase(fetchDashboardPerformance.fulfilled,  (state, { payload }) => { state.performance = payload })
      .addCase(fetchModuleStars.fulfilled,           (state, { payload }) => { state.moduleStars = payload || {} })
      .addCase(fetchDashboardAnswers.fulfilled,      (state, { payload }) => { state.answers = payload || [] })
  },
})

export default dashboardSlice.reducer
