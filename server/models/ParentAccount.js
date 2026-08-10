const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  photoURL: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('ParentAccount', schema)
