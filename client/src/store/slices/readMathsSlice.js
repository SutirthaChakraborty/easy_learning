import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsReadQuestions = createAsyncThunk(
  'readMaths/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/read/maths?lang=${lang}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch maths reading questions')
    const json = await res.json()
    return json.data
  }
)

const readMathsSlice = createSlice({
  name: 'readMaths',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resetMathsReadQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsReadQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsReadQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchMathsReadQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetMathsReadQuestions } = readMathsSlice.actions
export default readMathsSlice.reducer
