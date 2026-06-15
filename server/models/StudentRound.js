const mongoose = require('mongoose')

const studentRoundSchema = new mongoose.Schema({
  email:       { type: String, required: true, index: true },
  module:      { type: String, required: true },
  subject:     { type: String, default: 'general' },
  mode:        { type: String, enum: ['practice', 'warrior'], default: 'practice' },
  stars:       { type: Number, default: 0 },      // correct answers (0-10)
  bonusStars:  { type: Number, default: 0 },      // warrior speed bonus
  totalStars:  { type: Number, default: 0 },      // stars + bonusStars
  passed:      { type: Boolean, default: null },  // warrior only: stars >= 6
  completedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('StudentRound', studentRoundSchema)
