const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, default: '', lowercase: true, trim: true,
    match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  age: { type: Number, default: null, min: 3, max: 25 },
  grade: { type: String, default: '' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  tutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = adminDb.model('Student', schema)
