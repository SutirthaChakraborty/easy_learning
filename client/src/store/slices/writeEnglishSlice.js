import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchEnglishWriteQuestions = createAsyncThunk(
  'writeEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/write/english`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch english writing questions')
    const json = await res.json()
    return json.data
  }
)

const writeEnglishSlice = createSlice({
  name: 'writeEnglish',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnglishWriteQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEnglishWriteQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.questions = arr.slice(0, Math.min(10, arr.length))
      })
      .addCase(fetchEnglishWriteQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default writeEnglishSlice.reducer
