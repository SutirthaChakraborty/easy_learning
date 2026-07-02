import { configureStore } from '@reduxjs/toolkit'
import listenScienceReducer from './slices/listenScienceSlice'
import listenMathsReducer from './slices/listenMathsSlice'
import listenEnglishReducer from './slices/listenEnglishSlice'
import readScienceReducer from './slices/readScienceSlice'
import readMathsReducer from './slices/readMathsSlice'
import readEnglishReducer from './slices/readEnglishSlice'
import writeScienceReducer from './slices/writeScienceSlice'
import writeMathsReducer   from './slices/writeMathsSlice'
import writeEnglishReducer from './slices/writeEnglishSlice'
import speakScienceReducer from './slices/speakScienceSlice'
import speakMathsReducer   from './slices/speakMathsSlice'
import speakEnglishReducer from './slices/speakEnglishSlice'
import spellEnglishReducer from './slices/spellEnglishSlice'
import memoryMatchReducer  from './slices/memoryMatchSlice'
import wordPuzzleReducer   from './slices/wordPuzzleSlice'
import learnReducer        from './slices/learnSlice'
import dashboardReducer   from './slices/dashboardSlice'

const store = configureStore({
  reducer: {
    listenScience: listenScienceReducer,
    listenMaths:   listenMathsReducer,
    listenEnglish: listenEnglishReducer,
    readScience:   readScienceReducer,
    readMaths:     readMathsReducer,
    readEnglish:   readEnglishReducer,
    writeScience:  writeScienceReducer,
    writeMaths:    writeMathsReducer,
    writeEnglish:  writeEnglishReducer,
    speakScience:  speakScienceReducer,
    speakMaths:    speakMathsReducer,
    speakEnglish:  speakEnglishReducer,
    spellEnglish:  spellEnglishReducer,
    memoryMatch:   memoryMatchReducer,
    wordPuzzle:    wordPuzzleReducer,
    learn:         learnReducer,
    dashboard:     dashboardReducer,
  },
})

export default store
