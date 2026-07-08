const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const scheduleSlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: false })

const subjectAssignmentSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  schedule: [scheduleSlotSchema],
})

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subject: { type: String, default: '' },
  description: { type: String, default: '' },
  academicYear: { type: String, default: '', trim: true },
  term: { type: String, default: '', trim: true },
  maxStudents: { type: Number, default: null, min: 1 },
  subjects: [subjectAssignmentSchema],
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  directTutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  // Derived (batchService.syncBatchDerivedFields): union of directTutorIds + subjects[].teacherIds.
  tutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

schema.index({ orgId: 1, 'subjects.teacherIds': 1 })
schema.index({ orgId: 1, 'subjects.subject': 1 })
schema.index({ orgId: 1, tutorIds: 1 })

module.exports = adminDb.model('Batch', schema)
