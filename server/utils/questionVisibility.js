const Student = require('../models/admin/Student')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')

// Whether this email has a Student record (every Student requires an orgId, so
// having a record at all means the student belongs to an organization), plus
// their class/roster batch ids (adminDb Batch, as strings).
async function getStudentOrgInfo(email) {
  if (!email) return { isOrgStudent: false, batchIds: [] }
  const student = await Student.findOne({ email }).select('batchIds')
  if (!student) return { isOrgStudent: false, batchIds: [] }
  return { isOrgStudent: true, batchIds: student.batchIds.map(String) }
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

// Resolves the Mongo filter fragment and whether the "no org questions uploaded"
// message should be shown. Students with no Student record (not part of any
// organization) see developer/seed questions (uploadBatchId: null). Students who
// belong to an organization only ever see their batch's teacher-uploaded questions
// for this module/subject - never the developer/seed set, even if none exist yet.
async function buildQuestionVisibilityFilter(email, module, subject) {
  const { isOrgStudent, batchIds } = await getStudentOrgInfo(email)

  if (!isOrgStudent) {
    return { filter: { uploadBatchId: null }, noOrgQuestions: false }
  }

  const uploadBatchIds = await getVisibleUploadBatchIds(module, subject, batchIds)
  return {
    filter: { uploadBatchId: { $in: uploadBatchIds } },
    noOrgQuestions: uploadBatchIds.length === 0,
  }
}

module.exports = { getStudentOrgInfo, getVisibleUploadBatchIds, buildQuestionVisibilityFilter }
