const mongoose = require('mongoose')

const writeScienceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  character: { type: String, required: true },
  type: { type: String, required: true, enum: ['letter', 'word', 'number', 'symbol', 'shape'] },
  hint: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  emoji: { type: String, default: '' },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true }
}, { timestamps: true })

module.exports = mongoose.model('WriteScience', writeScienceSchema)
