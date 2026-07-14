import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchMathsQuestions = createAsyncThunk(
  'listenMaths/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/maths?lang=${lang}`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch maths questions')
    const json = await res.json()
    return json.data
  }
)

const listenMathsSlice = createSlice({
  name: 'listenMaths',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resetMathsListenQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.questions = arr.slice(0, Math.min(10, arr.length))
      })
      .addCase(fetchMathsQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetMathsListenQuestions } = listenMathsSlice.actions
export default listenMathsSlice.reducer
