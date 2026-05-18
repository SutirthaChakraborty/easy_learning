const mongoose = require('mongoose')

const speakMathsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  emoji: { type: String, default: '🔢' }
})

module.exports = mongoose.model('SpeakMaths', speakMathsSchema)
