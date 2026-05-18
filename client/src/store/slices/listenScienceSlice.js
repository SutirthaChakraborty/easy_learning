import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceQuestions = createAsyncThunk(
  'listenScience/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/science`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science questions')
    const json = await res.json()
    return json.data
  }
)

const listenScienceSlice = createSlice({
  name: 'listenScience',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchScienceQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default listenScienceSlice.reducer
