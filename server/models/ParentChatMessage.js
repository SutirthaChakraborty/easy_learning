const mongoose = require('mongoose')
const superAdminDb = require('../db/superAdminDb')

const schema = new mongoose.Schema({
  parentUid: { type: String, required: true, index: true },
  parentName: { type: String, default: '' },
  senderRole: { type: String, enum: ['parent', 'superadmin'], required: true },
  message: { type: String, required: true, trim: true },
  readByParent: { type: Boolean, default: false },
  readBySuperadmin: { type: Boolean, default: false },
}, { timestamps: true })

schema.index({ parentUid: 1, createdAt: 1 })

module.exports = superAdminDb.model('ParentChatMessage', schema)
