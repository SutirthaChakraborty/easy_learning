import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchCards = createAsyncThunk(
  'memoryMatch/fetchCards',
  async ({ count = 8, lang = 'en' } = {}, { rejectWithValue }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/game/memory-match/cards?count=${count}&lang=${lang}`,
      { credentials: 'include' }
    )
    if (!res.ok) return rejectWithValue('Failed to fetch memory match cards')
    const json = await res.json()
    return json.data.map(card => ({ ...card, matched: false }))
  }
)

const memoryMatchSlice = createSlice({
  name: 'memoryMatch',
  initialState: {
    cards: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    flipped: [],    // up to 2 card indices currently face-up
    moves: 0,
    won: false,
    locked: false,
  },
  reducers: {
    flipCard: (state, action) => {
      const idx = action.payload
      if (state.locked) return
      if (state.cards[idx].matched) return
      if (state.flipped.includes(idx)) return
      if (state.flipped.length >= 2) return

      state.flipped.push(idx)

      if (state.flipped.length === 2) {
        state.moves += 1
        state.locked = true
      }
    },

    resolveFlip: (state) => {
      const [a, b] = state.flipped
      if (state.cards[a].pairId === state.cards[b].pairId) {
        state.cards[a].matched = true
        state.cards[b].matched = true
        if (state.cards.every(c => c.matched)) {
          state.won = true
        }
      }
      state.flipped = []
      state.locked = false
    },

    resetGame: (state) => {
      state.cards = []
      state.flipped = []
      state.moves = 0
      state.won = false
      state.locked = false
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.cards = action.payload
        state.flipped = []
        state.moves = 0
        state.won = false
        state.locked = false
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { flipCard, resolveFlip, resetGame } = memoryMatchSlice.actions
export default memoryMatchSlice.reducer
