import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchMathsSpeakPrompts = createAsyncThunk(
  'speakMaths/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/speak/maths?lang=${lang}`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch maths speaking prompts')
    const json = await res.json()
    return { data: json.data, noOrgQuestions: json.noOrgQuestions }
  }
)

const speakMathsSlice = createSlice({
  name: 'speakMaths',
  initialState: {
    prompts: [],
    status: 'idle',
    error: null,
    noOrgQuestions: false,
  },
  reducers: {
    resetMathsSpeakPrompts: (state) => {
      state.prompts = []
      state.status = 'idle'
      state.error = null
      state.noOrgQuestions = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsSpeakPrompts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsSpeakPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload.data ? [...action.payload.data].sort(() => Math.random() - 0.5) : []
        state.prompts = arr.slice(0, Math.min(10, arr.length))
        state.noOrgQuestions = action.payload.noOrgQuestions
      })
      .addCase(fetchMathsSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetMathsSpeakPrompts } = speakMathsSlice.actions
export default speakMathsSlice.reducer
