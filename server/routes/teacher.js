const express = require('express')
const router = express.Router()
const teacherAuth = require('../middleware/teacherAuth')
const validate = require('../middleware/validate')
const { uploadQuestionSheet, handleUpload } = require('../middleware/upload')
const { addStudentsToBatchValidator, updateStudentValidator, scheduleSlotValidator, checkConflictValidator } = require('../validators/adminValidators')
const { uploadQuestionsValidator } = require('../validators/teacherValidators')
const {
  getStudents, updateStudent,
  getBatches, getBatch,
  addStudentsToBatch, removeStudentFromBatch,
  addScheduleSlot, removeScheduleSlot, checkScheduleConflict,
  getStudentPerformance,
} = require('../controllers/teacherController')
const {
  getQuestionTemplate, uploadQuestions, getMyUploadBatches, getMyUploadBatchDetail, updateQuestion,
} = require('../controllers/teacherQuestionController')

router.use(teacherAuth)

router.get('/students', getStudents)
router.patch('/students/:id', updateStudentValidator, validate, updateStudent)
router.get('/batches', getBatches)
router.get('/batches/:id', getBatch)
router.post('/batches/:id/students', addStudentsToBatchValidator, validate, addStudentsToBatch)
router.delete('/batches/:id/students/:studentId', removeStudentFromBatch)
router.get('/batches/:id/students/:studentId/performance', getStudentPerformance)
router.post('/batches/:id/subjects/:subjectAssignmentId/schedule', scheduleSlotValidator, validate, addScheduleSlot)
router.delete('/batches/:id/subjects/:subjectAssignmentId/schedule/:slotId', removeScheduleSlot)
router.post('/schedule/check-conflict', checkConflictValidator, validate, checkScheduleConflict)

router.get('/questions/template', getQuestionTemplate)
router.post('/questions/upload', handleUpload(uploadQuestionSheet.single('file')), uploadQuestionsValidator, validate, uploadQuestions)
router.get('/questions/uploads', getMyUploadBatches)
router.get('/questions/uploads/:id', getMyUploadBatchDetail)
router.patch('/questions/:module/:subject/:id', updateQuestion)

module.exports = router
