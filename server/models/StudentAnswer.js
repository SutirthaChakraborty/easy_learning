const mongoose = require('mongoose')

const studentAnswerSchema = new mongoose.Schema({
  email:         { type: String, required: true, index: true },
  module:        { type: String, required: true },
  subject:       { type: String, default: 'general' },
  question:      { type: String, default: '' },
  userAnswer:    { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  correct:       { type: Boolean, required: true },
  xpEarned:     { type: Number, default: 0 },
  timeTaken:    { type: Number, default: null },
  mode:         { type: String, default: 'practice' },
  timestamp:    { type: Date, default: Date.now },
})

module.exports = mongoose.model('StudentAnswer', studentAnswerSchema)
