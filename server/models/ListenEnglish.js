const mongoose = require('mongoose')

const listenEnglishSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  sentence: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  emoji: { type: String, default: '' },
  xp: { type: Number, required: true }
})

module.exports = mongoose.model('ListenEnglish', listenEnglishSchema)
