const mongoose = require('mongoose')

const speakMathsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  emoji: { type: String, default: '🔢' },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true }
}, { timestamps: true })

module.exports = mongoose.model('SpeakMaths', speakMathsSchema)
