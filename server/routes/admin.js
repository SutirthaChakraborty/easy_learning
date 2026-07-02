const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const {
  registerOrg, getOrg,
  getTutors, createTutor, deleteTutor,
  getBatches, createBatch, deleteBatch,
  getStudents, createStudent, deleteStudent,
  getParents, createParent,
  getStats,
} = require('../controllers/adminController')

router.use(adminAuth)

router.get('/stats', getStats)

router.get('/org', getOrg)
router.post('/org', registerOrg)

router.get('/tutors', getTutors)
router.post('/tutors', createTutor)
router.delete('/tutors/:id', deleteTutor)

router.get('/batches', getBatches)
router.post('/batches', createBatch)
router.delete('/batches/:id', deleteBatch)

router.get('/students', getStudents)
router.post('/students', createStudent)
router.delete('/students/:id', deleteStudent)

router.get('/parents', getParents)
router.post('/parents', createParent)

module.exports = router
