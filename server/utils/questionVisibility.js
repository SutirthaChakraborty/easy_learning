const Student = require('../models/admin/Student')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')

// Class/roster batch ids (adminDb Batch, as strings) the given email's Student
// record belongs to. Empty for students with no Student record or no batch.
async function getStudentBatchIds(email) {
  if (!email) return []
  const student = await Student.findOne({ email }).select('batchIds')
  return student ? student.batchIds.map(String) : []
}

// Ids of approved teacher upload batches (superAdminDb QuestionUploadBatch) for this
// module/subject that target at least one of the student's batches.
async function getVisibleUploadBatchIds(module, subject, studentBatchIds) {
  if (!studentBatchIds.length) return []
  const uploads = await QuestionUploadBatch.find({
    module, subject, status: 'approved',
    batchIds: { $in: studentBatchIds },
  }).select('_id')
  return uploads.map((u) => u._id.toString())
}

// Mongo filter fragment: developer/seed questions (uploadBatchId null) are always
// visible; teacher-uploaded questions only if targeted at one of the student's batches.
async function buildQuestionVisibilityFilter(email, module, subject) {
  const studentBatchIds = await getStudentBatchIds(email)
  const uploadBatchIds = await getVisibleUploadBatchIds(module, subject, studentBatchIds)
  return {
    $or: [
      { uploadBatchId: null },
      ...(uploadBatchIds.length ? [{ uploadBatchId: { $in: uploadBatchIds } }] : []),
    ],
  }
}

module.exports = { getStudentBatchIds, getVisibleUploadBatchIds, buildQuestionVisibilityFilter }
