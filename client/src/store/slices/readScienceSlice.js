import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceReadQuestions = createAsyncThunk(
  'readScience/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/read/science?lang=${lang}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science reading questions')
    const json = await res.json()
    return json.data
  }
)

const readScienceSlice = createSlice({
  name: 'readScience',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resetScienceReadQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceReadQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceReadQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.questions = arr.slice(0, Math.min(10, arr.length))
      })
      .addCase(fetchScienceReadQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetScienceReadQuestions } = readScienceSlice.actions
export default readScienceSlice.reducer
