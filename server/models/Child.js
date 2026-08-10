const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentAccount', required: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 25 },
  email: {
    type: String, required: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
}, { timestamps: true })

module.exports = mongoose.model('Child', schema)
