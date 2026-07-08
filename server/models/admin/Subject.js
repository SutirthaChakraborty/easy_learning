const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, default: '', lowercase: true, trim: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  description: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

schema.index({ orgId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })
schema.index({ orgId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string', $gt: '' } } })

module.exports = adminDb.model('Subject', schema)
