const mongoose = require('mongoose')

const memoryMatchSchema = new mongoose.Schema({
  id:           { type: Number, required: true, unique: true },
  emoji:        { type: String, required: true },
  label:        { type: String, required: true },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { id: false })

module.exports = mongoose.model('MemoryMatch', memoryMatchSchema)
