import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchScienceSpeakPrompts = createAsyncThunk(
  'speakScience/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/speak/science`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch science speaking prompts')
    const json = await res.json()
    return json.data
  }
)

const speakScienceSlice = createSlice({
  name: 'speakScience',
  initialState: {
    prompts: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceSpeakPrompts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceSpeakPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.prompts = action.payload
      })
      .addCase(fetchScienceSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default speakScienceSlice.reducer
