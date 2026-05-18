import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchEnglishQuestions = createAsyncThunk(
  'listenEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/english`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch english listening questions')
    const json = await res.json()
    return json.data
  }
)

const listenEnglishSlice = createSlice({
  name: 'listenEnglish',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
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
        state.questions = action.payload
      })
      .addCase(fetchEnglishQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default listenEnglishSlice.reducer
