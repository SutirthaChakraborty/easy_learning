import { configureStore } from '@reduxjs/toolkit'
import questionsReducer from './slices/questionsSlice'
import dashboardReducer from './slices/dashboardSlice'

const store = configureStore({
  reducer: {
    questions: questionsReducer,
    dashboard: dashboardReducer,
  },
})

export default store
