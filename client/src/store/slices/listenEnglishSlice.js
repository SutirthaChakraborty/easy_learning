import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchEnglishQuestions = createAsyncThunk(
  'listenEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/english`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch english listening questions')
    const json = await res.json()
    return { data: json.data, noOrgQuestions: json.noOrgQuestions }
  }
)

const listenEnglishSlice = createSlice({
  name: 'listenEnglish',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    noOrgQuestions: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnglishQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEnglishQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload.data ? [...action.payload.data].sort(() => Math.random() - 0.5) : []
        state.questions = arr.slice(0, Math.min(10, arr.length))
        state.noOrgQuestions = action.payload.noOrgQuestions
      })
      .addCase(fetchEnglishQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default listenEnglishSlice.reducer
