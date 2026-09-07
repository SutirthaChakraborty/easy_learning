import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

const BASE = import.meta.env.VITE_API_BASE_URL

// Single slice for all 12 Listen/Read/Write/Speak x English/Maths/Science
// question endpoints — the fetch/shuffle/slice-to-10 logic was byte-for-byte
// identical across the 12 slices this replaces, so they're cached here by a
// "module:subject" key instead.
export const fetchQuestions = createAsyncThunk(
  'questions/fetchAll',
  async ({ module, subject, lang }, { rejectWithValue }) => {
    const qs = lang && subject !== 'english' ? `?lang=${lang}` : ''
    const res = await fetch(`${BASE}/${module}/${subject}${qs}`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch questions')
    const json = await res.json()
    return { data: json.data, noOrgQuestions: json.noOrgQuestions }
  }
)

const keyOf = (module, subject) => `${module}:${subject}`

const questionsSlice = createSlice({
  name: 'questions',
  initialState: { byKey: {} },
  reducers: {
    resetQuestions: (state, action) => {
      delete state.byKey[keyOf(action.payload.module, action.payload.subject)]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        state.byKey[key] = { questions: [], status: 'loading', error: null, noOrgQuestions: false }
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        const arr = action.payload.data ? [...action.payload.data].sort(() => Math.random() - 0.5) : []
        state.byKey[key] = {
          questions: arr.slice(0, Math.min(10, arr.length)),
          status: 'succeeded',
          error: null,
          noOrgQuestions: action.payload.noOrgQuestions,
        }
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        state.byKey[key] = { questions: [], status: 'failed', error: action.payload, noOrgQuestions: false }
      })
  },
})

export const { resetQuestions } = questionsSlice.actions

const EMPTY_STATE = { questions: [], status: 'idle', error: null, noOrgQuestions: false }
export const selectQuestionState = (state, module, subject) =>
  state.questions.byKey[keyOf(module, subject)] || EMPTY_STATE

export default questionsSlice.reducer
