import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchMathsSpeakPrompts = createAsyncThunk(
  'speakMaths/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5000/api/speak/maths', { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch maths speaking prompts')
    const json = await res.json()
    return json.data
  }
)

const speakMathsSlice = createSlice({
  name: 'speakMaths',
  initialState: {
    prompts: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMathsSpeakPrompts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMathsSpeakPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.prompts = action.payload
      })
      .addCase(fetchMathsSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default speakMathsSlice.reducer
