const mongoose = require('mongoose')

const writeEnglishSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  character: { type: String, required: true },
  type: { type: String, required: true, enum: ['letter', 'word', 'number', 'symbol', 'shape'] },
  hint: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  emoji: { type: String, default: '' }
})

module.exports = mongoose.model('WriteEnglish', writeEnglishSchema)
