import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsQuestions = createAsyncThunk(
  'listenMaths/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/listen/maths`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch maths questions')
    const json = await res.json()
    return json.data
  }
)

const listenMathsSlice = createSlice({
  name: 'listenMaths',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsQuestions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.questions = action.payload
      })
      .addCase(fetchMathsQuestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default listenMathsSlice.reducer
