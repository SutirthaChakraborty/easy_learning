import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchEnglishWriteQuestions = createAsyncThunk(
  'writeEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/write/english`, { credentials: 'include' })
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
        state.questions = action.payload
      })
      .addCase(fetchEnglishWriteQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default writeEnglishSlice.reducer
