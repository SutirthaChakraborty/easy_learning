const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  durationMinutes: { type: Number, default: 0 },
  module:  { type: String, default: 'general' }, // listen|read|write|speak|spelling|memory|puzzle|learn
  subject: { type: String, default: 'general' }, // english|maths|science|general
  xpEarned: { type: Number, default: 0 },
  score:    { type: Number, default: 0 }, // 0–100 percentage
}, { _id: false })

const studentActivitySchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  date:  { type: Date, required: true }, // midnight UTC of the day
  sessions: [sessionSchema],
  totalMinutes: { type: Number, default: 0 },
  totalXP:      { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
}, { timestamps: true })

studentActivitySchema.index({ email: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('StudentActivity', studentActivitySchema)
