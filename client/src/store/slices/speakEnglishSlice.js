import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchEnglishSpeakPrompts = createAsyncThunk(
  'speakEnglish/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/speak/english`, { credentials: 'include', headers: authHeaders() })
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
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.prompts = arr.slice(0, Math.min(10, arr.length))
      })
      .addCase(fetchEnglishSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default speakEnglishSlice.reducer
