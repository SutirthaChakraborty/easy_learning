import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsReadQuestions = createAsyncThunk(
  'readMaths/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5000/api/read/maths', { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch maths reading questions')
    const json = await res.json()
    return json.data
  }
)

const readMathsSlice = createSlice({
  name: 'readMaths',
  initialState: {
    questions: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
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

export default readMathsSlice.reducer
