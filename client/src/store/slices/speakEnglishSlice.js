import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchEnglishSpeakPrompts = createAsyncThunk(
  'speakEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5000/api/speak/english', { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch english speaking prompts')
    const json = await res.json()
    return json.data
  }
)

const speakEnglishSlice = createSlice({
  name: 'speakEnglish',
  initialState: {
    prompts: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnglishSpeakPrompts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEnglishSpeakPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.prompts = action.payload
      })
      .addCase(fetchEnglishSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default speakEnglishSlice.reducer
