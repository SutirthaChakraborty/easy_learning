const mongoose = require('mongoose')
const superAdminDb = require('../db/superAdminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['student', 'admin', 'teacher', 'parent', 'other'], required: true },
  orgName: { type: String, default: '' },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  attachmentUrl: { type: String, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  reply: { type: String, default: '' },
  respondedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = superAdminDb.model('ContactMessage', schema)
