import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsWriteQuestions = createAsyncThunk(
  'writeMaths/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/write/maths?lang=${lang}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch maths writing questions')
    const json = await res.json()
    return json.data
  }
)

const writeMathsSlice = createSlice({
  name: 'writeMaths',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resetMathsWriteQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsWriteQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsWriteQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchMathsWriteQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetMathsWriteQuestions } = writeMathsSlice.actions
export default writeMathsSlice.reducer
