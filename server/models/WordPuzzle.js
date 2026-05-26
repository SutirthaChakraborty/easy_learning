const mongoose = require('mongoose')

const wordPuzzleSchema = new mongoose.Schema({
  id:           { type: Number, required: true, unique: true },
  word:         { type: String, required: true },
  hint:         { type: String, required: true },
  emoji:        { type: String, default: '' },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { id: false })

module.exports = mongoose.model('WordPuzzle', wordPuzzleSchema)
