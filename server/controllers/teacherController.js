const Batch = require('../models/admin/Batch')
const Student = require('../models/admin/Student')
const { getPerformanceForEmail } = require('../utils/performance')
const batchService = require('../services/batchService')
const { checkTeacherConflict } = require('../services/scheduleConflictService')

const handleServiceError = (res, err) => {
  if (err instanceof batchService.ServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.max !== undefined ? { capacity: { max: err.max, current: err.current, attempted: err.attempted } } : {}),
      ...(err.conflicts !== undefined ? { conflicts: err.conflicts } : {}),
    })
  }
  console.error(err)
  res.status(500).json({ success: false, message: 'Internal server error' })
}

// A batch is only visible/editable by a teacher if they're on it — either
// batch-level (directTutorIds) or via a subject assignment (subjects.teacherIds),
// both folded into the derived Batch.tutorIds field.
const findAssignedBatch = (req) => Batch.findOne({
  _id: req.params.id, orgId: req.teacher.orgId, tutorIds: req.teacher.id,
})

// Org-wide student list, so a teacher can pick who to add to a batch's roster
// (mirrors adminController.getStudents, scoped to the teacher's org instead of admin's).
const getStudents = async (req, res) => {
  try {
    const filter = { orgId: req.teacher.orgId }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const students = await Student.find(filter).sort({ name: 1 })
    res.json({ success: true, students })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// A student is only editable by a teacher if the student is actually assigned to
// them (Student.tutorIds is kept in sync by batchService whenever rosters change).
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, orgId: req.teacher.orgId, tutorIds: req.teacher.id })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    const { name, email, age, grade, status } = req.body

    if (email) {
      const dup = await Student.findOne({ orgId: req.teacher.orgId, email: email.toLowerCase(), _id: { $ne: student._id } })
      if (dup) return res.status(409).json({ success: false, message: 'A student with this email already exists' })
    }

    if (name !== undefined) student.name = name
    if (email !== undefined) student.email = email
    if (age !== undefined) student.age = age === '' || age === null ? null : Number(age)
    if (grade !== undefined) student.grade = grade
    if (status !== undefined) student.status = status

    await student.save()
    res.json({ success: true, student })
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message })
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ orgId: req.teacher.orgId, tutorIds: req.teacher.id })
      .populate('studentIds', 'name email')
      .populate('directTutorIds', 'name email')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacherIds', 'name email')
      .sort({ createdAt: -1 })
    res.json({ success: true, batches })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getBatch = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
      .populate('studentIds', 'name email age grade status')
      .populate('directTutorIds', 'name email')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacherIds', 'name email')
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    res.json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const addStudentsToBatch = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    const updated = await batchService.addStudentsToBatch(batch._id, req.body.studentIds)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeStudentFromBatch = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    const updated = await batchService.removeStudentFromBatch(batch._id, req.params.studentId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const addScheduleSlot = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const assignment = batch.subjects.id(req.params.subjectAssignmentId)
    if (!assignment) return res.status(404).json({ success: false, message: 'Subject assignment not found' })
    const teachesThisSubject = assignment.teacherIds.some((tid) => tid.toString() === req.teacher.id)
    if (!teachesThisSubject) return res.status(403).json({ success: false, message: 'You can only manage the schedule for subjects you teach' })

    const { dayOfWeek, startTime, endTime } = req.body
    const updated = await batchService.addScheduleSlot(batch._id, req.params.subjectAssignmentId, {
      dayOfWeek: Number(dayOfWeek), startTime, endTime,
    })
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeScheduleSlot = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const assignment = batch.subjects.id(req.params.subjectAssignmentId)
    if (!assignment) return res.status(404).json({ success: false, message: 'Subject assignment not found' })
    const teachesThisSubject = assignment.teacherIds.some((tid) => tid.toString() === req.teacher.id)
    if (!teachesThisSubject) return res.status(403).json({ success: false, message: 'You can only manage the schedule for subjects you teach' })

    const updated = await batchService.removeScheduleSlot(batch._id, req.params.subjectAssignmentId, req.params.slotId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const checkScheduleConflict = async (req, res) => {
  try {
    const { tutorId, dayOfWeek, startTime, endTime, scheduleSlotId } = req.body
    const conflicts = await checkTeacherConflict(
      req.teacher.orgId, tutorId, { dayOfWeek: Number(dayOfWeek), startTime, endTime }, { scheduleSlotId }
    )
    res.json({ success: true, conflicts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getStudentPerformance = async (req, res) => {
  try {
    const batch = await findAssignedBatch(req)
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const inBatch = batch.studentIds.some((sid) => sid.toString() === req.params.studentId)
    if (!inBatch) return res.status(404).json({ success: false, message: 'Student not found in this batch' })

    const student = await Student.findById(req.params.studentId)
    if (!student) return res.status(404).json({ success: false, message: 'Student not found in this batch' })

    const performance = await getPerformanceForEmail(student.email)
    res.json({ success: true, student: { id: student._id, name: student.name, email: student.email }, performance })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {
  getStudents, updateStudent,
  getBatches, getBatch,
  addStudentsToBatch, removeStudentFromBatch,
  addScheduleSlot, removeScheduleSlot, checkScheduleConflict,
  getStudentPerformance,
}
