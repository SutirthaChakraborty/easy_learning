import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchEnglishReadQuestions = createAsyncThunk(
  'readEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5000/api/read/english', { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch english reading questions')
    const json = await res.json()
    return json.data
  }
)

const readEnglishSlice = createSlice({
  name: 'readEnglish',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnglishReadQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEnglishReadQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchEnglishReadQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default readEnglishSlice.reducer
