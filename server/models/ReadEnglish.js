const mongoose = require('mongoose')

const readEnglishSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  emoji: { type: String, default: '' }
})

module.exports = mongoose.model('ReadEnglish', readEnglishSchema)
