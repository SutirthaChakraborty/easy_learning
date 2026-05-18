import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsWriteQuestions = createAsyncThunk(
  'writeMaths/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5000/api/write/maths', { credentials: 'include' })
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
  reducers: {},
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

export default writeMathsSlice.reducer
