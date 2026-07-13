const mongoose = require('mongoose')

const readMathsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  emoji: { type: String, default: '' },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true }
}, { timestamps: true })

module.exports = mongoose.model('ReadMaths', readMathsSchema)
