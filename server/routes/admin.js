const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const validate = require('../middleware/validate')
const { uploadOrgLogo, uploadAvatar, handleUpload } = require('../middleware/upload')
const {
  registerOrgValidator, updateIdentityValidator,
  createTutorValidator, createStudentValidator, createParentValidator, createBatchValidator,
  sendChatMessageValidator,
} = require('../validators/adminValidators')
const {
  registerOrg, getOrg,
  getProfile, updateProfile,
  getTutors, createTutor, deleteTutor, getTutorPerformance,
  getBatches, createBatch, deleteBatch,
  getStudents, createStudent, deleteStudent, getStudentPerformance,
  getParents, createParent,
  getStats,
} = require('../controllers/adminController')
const { getMyThread, sendMyMessage, getMyUnreadCount } = require('../controllers/chatController')

router.use(adminAuth)

router.get('/stats', getStats)

router.get('/profile', getProfile)
router.patch('/profile', handleUpload(uploadAvatar.single('avatar')), updateIdentityValidator, validate, updateProfile)

router.get('/org', getOrg)
router.post('/org', handleUpload(uploadOrgLogo.single('logo')), registerOrgValidator, validate, registerOrg)

router.get('/chat', getMyThread)
router.post('/chat', sendChatMessageValidator, validate, sendMyMessage)
router.get('/chat/unread-count', getMyUnreadCount)

router.get('/tutors', getTutors)
router.post('/tutors', createTutorValidator, validate, createTutor)
router.delete('/tutors/:id', deleteTutor)
router.get('/tutors/:id/performance', getTutorPerformance)

router.get('/batches', getBatches)
router.post('/batches', createBatchValidator, validate, createBatch)
router.delete('/batches/:id', deleteBatch)

router.get('/students', getStudents)
router.post('/students', createStudentValidator, validate, createStudent)
router.delete('/students/:id', deleteStudent)
router.get('/students/:id/performance', getStudentPerformance)

router.get('/parents', getParents)
router.post('/parents', createParentValidator, validate, createParent)

module.exports = router
