const mongoose = require('mongoose')
const superAdminDb = require('../../db/superAdminDb')

const schema = new mongoose.Schema({
  module: { type: String, enum: ['read', 'write', 'listen', 'speak'], required: true },
  subject: { type: String, enum: ['english', 'maths', 'science'], required: true },

  submittedByTutorId: { type: String, required: true },
  submittedByName: { type: String, required: true },
  submittedByEmail: { type: String, required: true },
  orgId: { type: String, required: true },
  orgName: { type: String, required: true },

  originalFilename: { type: String, required: true },
  originalFileUrl: { type: String, required: true },

  rowCount: { type: Number, required: true },
  skippedRowCount: { type: Number, default: 0 },
  rowErrors: { type: [{ row: Number, field: String, message: String }], default: [] },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectionHistory: { type: [{ reason: String, rejectedAt: { type: Date, default: Date.now } }], default: [] },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = superAdminDb.model('QuestionUploadBatch', schema)
