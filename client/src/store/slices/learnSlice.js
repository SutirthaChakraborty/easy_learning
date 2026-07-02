import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchLearnQuestions = createAsyncThunk(
  'learn/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/learn?lang=${lang}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch learn questions')
    const json = await res.json()
    return json.data
  }
)

const learnSlice = createSlice({
  name: 'learn',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    resetLearnQuestions: (state) => {
      state.questions = []
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearnQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLearnQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchLearnQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetLearnQuestions } = learnSlice.actions
export default learnSlice.reducer
