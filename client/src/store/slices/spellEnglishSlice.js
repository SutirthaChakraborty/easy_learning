import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchSpellWords = createAsyncThunk(
  'spellEnglish/fetchAll',
  async ({ level, lang = 'en' } = {}, { rejectWithValue }) => {
    const base   = `${import.meta.env.VITE_API_BASE_URL}/spell/english`
    const params = new URLSearchParams({ lang })
    if (level) params.set('level', level)
    const res = await fetch(`${base}?${params}`, { credentials: 'include' })
    if (!res.ok) return rejectWithValue('Failed to fetch spelling words')
    const json = await res.json()
    return json.data
  }
)

export const checkSpellAnswer = createAsyncThunk(
  'spellEnglish/checkAnswer',
  async ({ id, answer }, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spell/english/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, answer }),
    })
    if (!res.ok) return rejectWithValue('Failed to check answer')
    return res.json()
  }
)

const spellEnglishSlice = createSlice({
  name: 'spellEnglish',
  initialState: {
    words: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    currentIndex: 0,
    score: 0,
    xpEarned: 0,
    result: null, // 'correct' | 'wrong' | null
  },
  reducers: {
    nextWord: (state) => {
      state.currentIndex = (state.currentIndex + 1) % state.words.length
      state.result = null
    },
    resetWord: (state) => {
      state.result = null
    },
    resetGame: (state) => {
      state.currentIndex = 0
      state.score = 0
      state.xpEarned = 0
      state.result = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpellWords.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSpellWords.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const arr = action.payload ? [...action.payload].sort(() => Math.random() - 0.5) : []
        state.words = arr.slice(0, Math.min(10, arr.length))
        state.currentIndex = 0
        state.score = 0
        state.xpEarned = 0
        state.result = null
      })
      .addCase(fetchSpellWords.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(checkSpellAnswer.fulfilled, (state, action) => {
        const { correct, xp } = action.payload
        state.result = correct ? 'correct' : 'wrong'
        if (correct) {
          state.score += 1
          state.xpEarned += xp
        }
      })
  },
})

export const { nextWord, resetWord, resetGame } = spellEnglishSlice.actions
export default spellEnglishSlice.reducer
