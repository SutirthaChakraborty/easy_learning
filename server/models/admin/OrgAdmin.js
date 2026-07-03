const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')
const { DESIGNATION_OPTIONS } = require('../../utils/constants')

const schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  role: { type: String, default: 'org_admin' },
  phone: { type: String, default: '' },
  designation: { type: String, enum: [...DESIGNATION_OPTIONS, ''], default: '' },
  designationOther: { type: String, default: '' },
}, { timestamps: true })

module.exports = adminDb.model('OrgAdmin', schema)
