const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  role: { type: String, default: 'org_admin' },
}, { timestamps: true })

module.exports = adminDb.model('OrgAdmin', schema)
