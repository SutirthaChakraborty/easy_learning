import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchPuzzleWords = createAsyncThunk(
  'wordPuzzle/fetchAll',
  async (lang = 'en', { rejectWithValue }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/game/word-puzzle/play?count=35&lang=${lang}`,
      { credentials: 'include' }
    )
    if (!res.ok) return rejectWithValue('Failed to fetch puzzle words')
    const json = await res.json()
    return json.data
  }
)

export const checkPuzzleAnswer = createAsyncThunk(
  'wordPuzzle/checkAnswer',
  async ({ id, answer }, { rejectWithValue }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/game/word-puzzle/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, answer }),
    })
    if (!res.ok) return rejectWithValue('Failed to check answer')
    return res.json()
  }
)

const buildTiles = (letters) =>
  letters.map((ch, i) => ({ id: i, ch, used: false }))

const wordPuzzleSlice = createSlice({
  name: 'wordPuzzle',
  initialState: {
    words: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    currentIndex: 0,
    tiles: [],        // [{ id, ch, used }]
    answer: [],       // [{ id, ch }]
    result: null,       // 'correct' | 'wrong' | null
    revealedWord: null, // set by server on wrong answer
    score: 0,
    showCelebration: false,
  },
  reducers: {
    pickTile(state, { payload: tileId }) {
      const tile = state.tiles.find((t) => t.id === tileId)
      if (!tile || tile.used || state.result) return
      tile.used = true
      state.answer.push({ id: tile.id, ch: tile.ch })
    },
    removeLast(state) {
      if (state.result || state.answer.length === 0) return
      const last = state.answer[state.answer.length - 1]
      const tile = state.tiles.find((t) => t.id === last.id)
      if (tile) tile.used = false
      state.answer.pop()
    },
    resetPuzzle(state) {
      const word = state.words[state.currentIndex]
      if (!word) return
      state.tiles = buildTiles(word.letters)
      state.answer = []
      state.result = null
      state.revealedWord = null
      state.showCelebration = false
    },
    nextWord(state) {
      state.currentIndex = (state.currentIndex + 1) % state.words.length
      const word = state.words[state.currentIndex]
      state.tiles = buildTiles(word.letters)
      state.answer = []
      state.result = null
      state.revealedWord = null
      state.showCelebration = false
    },
    resetGame(state) {
      state.currentIndex = 0
      const word = state.words[0]
      if (word) state.tiles = buildTiles(word.letters)
      state.answer = []
      state.result = null
      state.revealedWord = null
      state.score = 0
      state.showCelebration = false
    },
    hideCelebration(state) {
      state.showCelebration = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPuzzleWords.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPuzzleWords.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.words = action.payload
        state.currentIndex = 0
        state.tiles = action.payload.length ? buildTiles(action.payload[0].letters) : []
        state.answer = []
        state.result = null
        state.revealedWord = null
        state.score = 0
        state.showCelebration = false
      })
      .addCase(fetchPuzzleWords.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(checkPuzzleAnswer.fulfilled, (state, action) => {
        const { correct, word } = action.payload
        state.result = correct ? 'correct' : 'wrong'
        if (correct) {
          state.score += 1
          state.showCelebration = true
        } else {
          state.revealedWord = word
        }
      })
  },
})

export const {
  pickTile,
  removeLast,
  resetPuzzle,
  nextWord,
  resetGame,
  hideCelebration,
} = wordPuzzleSlice.actions

export default wordPuzzleSlice.reducer
