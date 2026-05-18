import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceReadQuestions = createAsyncThunk(
  'readScience/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/read/science`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science reading questions')
    const json = await res.json()
    return json.data
  }
)

const readScienceSlice = createSlice({
  name: 'readScience',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceReadQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceReadQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchScienceReadQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default readScienceSlice.reducer
