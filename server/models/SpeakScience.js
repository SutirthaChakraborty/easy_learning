const mongoose = require('mongoose')

const speakScienceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  emoji: { type: String, default: '🔬' },
  category: {
    type: String,
    required: true,
    enum: ['nature', 'weather', 'space', 'earth', 'body', 'science']
  }
})

module.exports = mongoose.model('SpeakScience', speakScienceSchema)
