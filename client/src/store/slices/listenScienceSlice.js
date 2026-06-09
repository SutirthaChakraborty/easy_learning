import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceQuestions = createAsyncThunk(
  'listenScience/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/science?lang=${lang}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science questions')
    const json = await res.json()
    return json.data
  }
)

const listenScienceSlice = createSlice({
  name: 'listenScience',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resetScienceListenQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.questions = arr.slice(0, Math.min(10, arr.length))
      })
      .addCase(fetchScienceQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetScienceListenQuestions } = listenScienceSlice.actions
export default listenScienceSlice.reducer
