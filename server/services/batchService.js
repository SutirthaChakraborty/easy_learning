const Batch = require('../models/admin/Batch')
const Tutor = require('../models/admin/Tutor')
const Student = require('../models/admin/Student')
const Subject = require('../models/admin/Subject')

class ServiceError extends Error {
  constructor(message, statusCode = 400, extra = {}) {
    super(message)
    this.statusCode = statusCode
    Object.assign(this, extra)
  }
}

class CapacityError extends ServiceError {
  constructor(max, current, attempted) {
    super('Adding these students would exceed the batch capacity', 409, { max, current, attempted })
  }
}

const idStr = (id) => (id === null || id === undefined ? id : id.toString())

const DEFAULT_SUBJECTS = [
  { name: 'English', code: 'english' },
  { name: 'Maths', code: 'maths' },
  { name: 'Science', code: 'science' },
]

// ── Subject catalog seeding ───────────────────────────────────────────────────

async function ensureDefaultSubjects(orgId) {
  const existing = await Subject.find({ orgId }).select('code')
  const existingCodes = new Set(existing.map((s) => s.code))
  const toCreate = DEFAULT_SUBJECTS.filter((s) => !existingCodes.has(s.code))
  if (toCreate.length === 0) return
  await Subject.insertMany(toCreate.map((s) => ({ ...s, orgId, isDefault: true })))
}

// ── Derived-field recompute (authoritative, source-of-truth is Batch) ────────

async function syncBatchDerivedFields(batchId) {
  const batch = await Batch.findById(batchId)
  if (!batch) return
  const tutorIdSet = new Set()
  for (const assignment of batch.subjects) {
    for (const tid of assignment.teacherIds) tutorIdSet.add(idStr(tid))
  }
  batch.tutorIds = Array.from(tutorIdSet)
  await batch.save()
}

async function recomputeTutorDerivedFields(tutorId) {
  const tutor = await Tutor.findById(tutorId)
  if (!tutor) return

  const batches = await Batch.find({ orgId: tutor.orgId, 'subjects.teacherIds': tutorId })
  const batchIdSet = new Set()
  const subjectIdSet = new Set()
  const studentIdSet = new Set()

  for (const batch of batches) {
    let teachesInBatch = false
    for (const assignment of batch.subjects) {
      if (assignment.teacherIds.some((tid) => idStr(tid) === idStr(tutorId))) {
        teachesInBatch = true
        subjectIdSet.add(idStr(assignment.subject))
      }
    }
    if (teachesInBatch) {
      batchIdSet.add(idStr(batch._id))
      for (const sid of batch.studentIds) studentIdSet.add(idStr(sid))
    }
  }

  tutor.batchIds = Array.from(batchIdSet)
  tutor.subjectIds = Array.from(subjectIdSet)
  tutor.studentIds = Array.from(studentIdSet)
  await tutor.save()
}

async function recomputeStudentDerivedFields(studentId) {
  const student = await Student.findById(studentId)
  if (!student) return

  const batches = await Batch.find({ studentIds: studentId })
  const batchIdSet = new Set()
  const tutorIdSet = new Set()

  for (const batch of batches) {
    batchIdSet.add(idStr(batch._id))
    for (const assignment of batch.subjects) {
      for (const tid of assignment.teacherIds) tutorIdSet.add(idStr(tid))
    }
  }

  student.batchIds = Array.from(batchIdSet)
  student.tutorIds = Array.from(tutorIdSet)
  await student.save()
}

// ── Batch <-> Subject ─────────────────────────────────────────────────────────

async function addSubjectToBatch(batchId, subjectId) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const subject = await Subject.findOne({ _id: subjectId, orgId: batch.orgId })
  if (!subject) throw new ServiceError('Subject not found', 404)

  const alreadyAdded = batch.subjects.some((a) => idStr(a.subject) === idStr(subjectId))
  if (alreadyAdded) throw new ServiceError('This subject is already added to the batch', 409)

  batch.subjects.push({ subject: subjectId, teacherIds: [], schedule: [] })
  await batch.save()
  return batch
}

async function removeSubjectFromBatch(batchId, subjectAssignmentId) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const assignment = batch.subjects.id(subjectAssignmentId)
  if (!assignment) throw new ServiceError('Subject assignment not found', 404)

  const affectedTutorIds = assignment.teacherIds.map(idStr)
  assignment.deleteOne()
  await batch.save()

  await syncBatchDerivedFields(batchId)
  for (const tid of affectedTutorIds) await recomputeTutorDerivedFields(tid)

  return batch
}

// ── Batch <-> Teacher (within a subject assignment) ──────────────────────────

async function assignTeacherToSubject(batchId, subjectAssignmentId, tutorId) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const assignment = batch.subjects.id(subjectAssignmentId)
  if (!assignment) throw new ServiceError('Subject assignment not found', 404)

  const tutor = await Tutor.findOne({ _id: tutorId, orgId: batch.orgId })
  if (!tutor) throw new ServiceError('Tutor not found', 404)

  const alreadyAssigned = assignment.teacherIds.some((tid) => idStr(tid) === idStr(tutorId))
  if (alreadyAssigned) throw new ServiceError('Teacher is already assigned to this subject', 409)

  assignment.teacherIds.push(tutorId)
  await batch.save()

  await syncBatchDerivedFields(batchId)
  await recomputeTutorDerivedFields(tutorId)

  return batch
}

async function unassignTeacherFromSubject(batchId, subjectAssignmentId, tutorId) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const assignment = batch.subjects.id(subjectAssignmentId)
  if (!assignment) throw new ServiceError('Subject assignment not found', 404)

  const before = assignment.teacherIds.length
  assignment.teacherIds = assignment.teacherIds.filter((tid) => idStr(tid) !== idStr(tutorId))
  if (assignment.teacherIds.length === before) throw new ServiceError('Teacher is not assigned to this subject', 404)

  await batch.save()
  await syncBatchDerivedFields(batchId)
  await recomputeTutorDerivedFields(tutorId)

  return batch
}

// ── Batch <-> Student roster ──────────────────────────────────────────────────

async function addStudentsToBatch(batchId, studentIds) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const students = await Student.find({ _id: { $in: studentIds }, orgId: batch.orgId })
  const existingSet = new Set(batch.studentIds.map(idStr))
  const newIds = students.map((s) => idStr(s._id)).filter((id) => !existingSet.has(id))

  const current = batch.studentIds.length
  if (batch.maxStudents != null && current + newIds.length > batch.maxStudents) {
    throw new CapacityError(batch.maxStudents, current, newIds.length)
  }

  if (newIds.length === 0) return batch

  batch.studentIds.push(...newIds)
  await batch.save()

  for (const id of newIds) await recomputeStudentDerivedFields(id)
  for (const tid of batch.tutorIds) await recomputeTutorDerivedFields(tid)

  return batch
}

async function removeStudentFromBatch(batchId, studentId) {
  const batch = await Batch.findById(batchId)
  if (!batch) throw new ServiceError('Batch not found', 404)

  const before = batch.studentIds.length
  batch.studentIds = batch.studentIds.filter((id) => idStr(id) !== idStr(studentId))
  if (batch.studentIds.length === before) throw new ServiceError('Student is not in this batch', 404)

  await batch.save()

  await recomputeStudentDerivedFields(studentId)
  for (const tid of batch.tutorIds) await recomputeTutorDerivedFields(tid)

  return batch
}

// ── Cascading deletes ─────────────────────────────────────────────────────────

async function deleteBatchCascade(batchId) {
  const batch = await Batch.findById(batchId)
  if (!batch) return

  const studentIds = batch.studentIds.map(idStr)
  const tutorIdSet = new Set()
  for (const assignment of batch.subjects) {
    for (const tid of assignment.teacherIds) tutorIdSet.add(idStr(tid))
  }

  await Batch.deleteOne({ _id: batchId })

  for (const sid of studentIds) await recomputeStudentDerivedFields(sid)
  for (const tid of tutorIdSet) await recomputeTutorDerivedFields(tid)
}

async function deleteTutorCascade(tutorId) {
  const tutor = await Tutor.findById(tutorId)
  if (!tutor) return

  const affectedBatches = await Batch.find({ orgId: tutor.orgId, 'subjects.teacherIds': tutorId })
  const affectedBatchIds = affectedBatches.map((b) => b._id)
  const affectedStudentIdSet = new Set()
  for (const batch of affectedBatches) {
    for (const sid of batch.studentIds) affectedStudentIdSet.add(idStr(sid))
  }

  if (affectedBatchIds.length > 0) {
    await Batch.updateMany(
      { _id: { $in: affectedBatchIds } },
      { $pull: { 'subjects.$[].teacherIds': tutorId } }
    )
  }

  await Tutor.deleteOne({ _id: tutorId })

  for (const batchId of affectedBatchIds) await syncBatchDerivedFields(batchId)
  for (const sid of affectedStudentIdSet) await recomputeStudentDerivedFields(sid)
}

async function deleteStudentCascade(studentId) {
  const student = await Student.findById(studentId)
  if (!student) return

  const affectedBatches = await Batch.find({ studentIds: studentId })
  const affectedTutorIdSet = new Set()
  for (const batch of affectedBatches) {
    for (const assignment of batch.subjects) {
      for (const tid of assignment.teacherIds) affectedTutorIdSet.add(idStr(tid))
    }
  }

  await Batch.updateMany({ studentIds: studentId }, { $pull: { studentIds: studentId } })
  await Student.deleteOne({ _id: studentId })

  for (const tid of affectedTutorIdSet) await recomputeTutorDerivedFields(tid)
}

module.exports = {
  ServiceError,
  CapacityError,
  ensureDefaultSubjects,
  syncBatchDerivedFields,
  recomputeTutorDerivedFields,
  recomputeStudentDerivedFields,
  addSubjectToBatch,
  removeSubjectFromBatch,
  assignTeacherToSubject,
  unassignTeacherFromSubject,
  addStudentsToBatch,
  removeStudentFromBatch,
  deleteBatchCascade,
  deleteTutorCascade,
  deleteStudentCascade,
}
