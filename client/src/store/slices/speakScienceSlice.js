import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

export const fetchScienceSpeakPrompts = createAsyncThunk(
  'speakScience/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/speak/science?lang=${lang}`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch science speaking prompts')
    const json = await res.json()
    return { data: json.data, noOrgQuestions: json.noOrgQuestions }
  }
)

const speakScienceSlice = createSlice({
  name: 'speakScience',
  initialState: {
    prompts: [],
    status: 'idle',
    error: null,
    noOrgQuestions: false,
  },
  reducers: {
    resetScienceSpeakPrompts: (state) => {
      state.prompts = []
      state.status = 'idle'
      state.error = null
      state.noOrgQuestions = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScienceSpeakPrompts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchScienceSpeakPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload.data ? [...action.payload.data].sort(() => Math.random() - 0.5) : []
        state.prompts = arr.slice(0, Math.min(10, arr.length))
        state.noOrgQuestions = action.payload.noOrgQuestions
      })
      .addCase(fetchScienceSpeakPrompts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetScienceSpeakPrompts } = speakScienceSlice.actions
export default speakScienceSlice.reducer
