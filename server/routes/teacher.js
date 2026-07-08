const express = require('express')
const router = express.Router()
const teacherAuth = require('../middleware/teacherAuth')
const validate = require('../middleware/validate')
const { addStudentsToBatchValidator, scheduleSlotValidator, checkConflictValidator } = require('../validators/adminValidators')
const {
  getStudents,
  getBatches, getBatch,
  addStudentsToBatch, removeStudentFromBatch,
  addScheduleSlot, removeScheduleSlot, checkScheduleConflict,
  getStudentPerformance,
} = require('../controllers/teacherController')

router.use(teacherAuth)

router.get('/students', getStudents)
router.get('/batches', getBatches)
router.get('/batches/:id', getBatch)
router.post('/batches/:id/students', addStudentsToBatchValidator, validate, addStudentsToBatch)
router.delete('/batches/:id/students/:studentId', removeStudentFromBatch)
router.get('/batches/:id/students/:studentId/performance', getStudentPerformance)
router.post('/batches/:id/subjects/:subjectAssignmentId/schedule', scheduleSlotValidator, validate, addScheduleSlot)
router.delete('/batches/:id/subjects/:subjectAssignmentId/schedule/:slotId', removeScheduleSlot)
router.post('/schedule/check-conflict', checkConflictValidator, validate, checkScheduleConflict)

module.exports = router
