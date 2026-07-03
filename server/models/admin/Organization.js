const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['school', 'coaching_centre', 'institution', 'other'], default: 'school' },
  adminEmail: { type: String, required: true, lowercase: true },
  adminUid: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectionHistory: { type: [{ reason: String, rejectedAt: { type: Date, default: Date.now } }], default: [] },
  logoUrl: { type: String, default: '' },
}, { timestamps: true })

module.exports = adminDb.model('Organization', schema)
