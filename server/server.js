
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config()

const authRoutes          = require('./routes/auth')
const adminAuthRoutes     = require('./routes/adminAuth')
const superadminAuthRoutes = require('./routes/superadminAuth')
const teacherAuthRoutes   = require('./routes/teacherAuth')
const adminRoutes         = require('./routes/admin')
const superadminRoutes    = require('./routes/superadmin')
const teacherRoutes       = require('./routes/teacher')
const contactRoutes       = require('./routes/contact')
const listenScienceRoutes = require('./routes/listenScience')
const listenMathsRoutes = require('./routes/listenMaths')
const listenEnglishRoutes = require('./routes/listenEnglish')
const readScienceRoutes = require('./routes/readScience')
const readMathsRoutes = require('./routes/readMaths')
const readEnglishRoutes = require('./routes/readEnglish')
const writeScienceRoutes = require('./routes/writeScience')
const writeMathsRoutes   = require('./routes/writeMaths')
const writeEnglishRoutes = require('./routes/writeEnglish')
const speakScienceRoutes = require('./routes/speakScience')
const speakMathsRoutes   = require('./routes/speakMaths')
const speakEnglishRoutes = require('./routes/speakEnglish')
const spellEnglishRoutes  = require('./routes/spellEnglish')
const memoryMatchRoutes   = require('./routes/memoryMatch')
const wordPuzzleRoutes    = require('./routes/wordPuzzle')
const learnRoutes         = require('./routes/learn')
const dashboardRoutes     = require('./routes/dashboard')

// Initialise separate DB connections before routes load models
require('./db/adminDb')
require('./db/superAdminDb')

const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim().replace(/\/$/, ''))
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error)
  })

app.use('/api/auth', authRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/superadmin/auth', superadminAuthRoutes)
app.use('/api/teacher/auth', teacherAuthRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/contact', contactRoutes)

app.get('/', (req, res) => {
  res.send('hello bachho')
})

app.use('/api/listen/science', listenScienceRoutes)
app.use('/api/listen/maths', listenMathsRoutes)
app.use('/api/listen/english', listenEnglishRoutes)
app.use('/api/read/science', readScienceRoutes)
app.use('/api/read/maths', readMathsRoutes)
app.use('/api/read/english', readEnglishRoutes)
app.use('/api/write/science', writeScienceRoutes)
app.use('/api/write/maths',   writeMathsRoutes)
app.use('/api/write/english', writeEnglishRoutes)
app.use('/api/speak/science', speakScienceRoutes)
app.use('/api/speak/maths',   speakMathsRoutes)
app.use('/api/speak/english', speakEnglishRoutes)
app.use('/api/spell/english',    spellEnglishRoutes)
app.use('/api/game/memory-match', memoryMatchRoutes)
app.use('/api/game/word-puzzle',  wordPuzzleRoutes)
app.use('/api/learn',            learnRoutes)
app.use('/api/dashboard',        dashboardRoutes)

// Global error handler — catches any unhandled errors from route handlers
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})