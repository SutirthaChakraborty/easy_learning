const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

const schema = new mongoose.Schema({
  adminUid: { type: String, required: true, index: true },
  orgName: { type: String, default: '' },
  senderRole: { type: String, enum: ['admin', 'superadmin'], required: true },
  message: { type: String, required: true, trim: true },
  readByAdmin: { type: Boolean, default: false },
  readBySuperadmin: { type: Boolean, default: false },
}, { timestamps: true })

schema.index({ adminUid: 1, createdAt: 1 })

module.exports = superAdminDb.model('ChatMessage', schema)
