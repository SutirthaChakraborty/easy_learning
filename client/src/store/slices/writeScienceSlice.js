import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceWriteQuestions = createAsyncThunk(
  'writeScience/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/write/science`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science writing questions')
    const json = await res.json()
    return json.data
  }
)

const writeScienceSlice = createSlice({
  name: 'writeScience',
  initialState: {
    questions: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceWriteQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceWriteQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchScienceWriteQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default writeScienceSlice.reducer
