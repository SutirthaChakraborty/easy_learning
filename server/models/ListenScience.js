const mongoose = require('mongoose')

const listenScienceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  sentence: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  emoji: { type: String, default: '' },
  xp: { type: Number, required: true },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true }
}, { timestamps: true })

module.exports = mongoose.model('ListenScience', listenScienceSchema)
