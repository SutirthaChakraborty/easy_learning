const mongoose = require('mongoose')

const spellEnglishSchema = new mongoose.Schema({
  id:           { type: Number, required: true, unique: true },
  word:         { type: String, required: true },
  hint:         { type: String, required: true },
  emoji:        { type: String, default: '' },
  level:        { type: Number, required: true, min: 1, max: 3 },
  xp:           { type: Number, required: true },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { id: false })

module.exports = mongoose.model('SpellEnglish', spellEnglishSchema)
