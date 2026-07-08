const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const validate = require('../middleware/validate')
const { uploadOrgLogo, uploadAvatar, handleUpload } = require('../middleware/upload')
const { adminStudentAccess } = require('../middleware/studentDashboardAccess')
const {
  registerOrgValidator, updateIdentityValidator,
  createTutorValidator, createStudentValidator, createParentValidator,
  createBatchValidator, updateBatchValidator,
  createSubjectValidator, updateSubjectValidator,
  addStudentsToBatchValidator, addSubjectToBatchValidator, assignTeacherValidator,
  scheduleSlotValidator, checkConflictValidator,
  sendChatMessageValidator,
} = require('../validators/adminValidators')
const {
  registerOrg, getOrg,
  getProfile, updateProfile,
  getTutors, createTutor, deleteTutor, getTutorPerformance, getTutorSchedule,
  getBatches, getBatch, createBatch, updateBatch, deleteBatch,
  addStudentsToBatch, removeStudentFromBatch,
  addSubjectToBatch, removeSubjectFromBatch,
  assignTeacherToSubject, unassignTeacherFromSubject,
  addScheduleSlot, removeScheduleSlot, checkScheduleConflict,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getStudents, createStudent, deleteStudent, getStudentPerformance,
  getParents, createParent,
  getStats,
} = require('../controllers/adminController')
const {
  getStats:        getStudentDashStats,
  getActivity:     getStudentDashActivity,
  getAchievements: getStudentDashAchievements,
  getPerformance:  getStudentDashPerformance,
  getAnswers:      getStudentDashAnswers,
  getRounds:       getStudentDashRounds,
} = require('../controllers/dashboardController')
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
router.get('/tutors/:id/schedule', getTutorSchedule)

router.post('/schedule/check-conflict', checkConflictValidator, validate, checkScheduleConflict)

router.get('/subjects', getSubjects)
router.post('/subjects', createSubjectValidator, validate, createSubject)
router.patch('/subjects/:id', updateSubjectValidator, validate, updateSubject)
router.delete('/subjects/:id', deleteSubject)

router.get('/batches', getBatches)
router.post('/batches', createBatchValidator, validate, createBatch)
router.get('/batches/:id', getBatch)
router.patch('/batches/:id', updateBatchValidator, validate, updateBatch)
router.delete('/batches/:id', deleteBatch)
router.post('/batches/:id/students', addStudentsToBatchValidator, validate, addStudentsToBatch)
router.delete('/batches/:id/students/:studentId', removeStudentFromBatch)
router.post('/batches/:id/subjects', addSubjectToBatchValidator, validate, addSubjectToBatch)
router.delete('/batches/:id/subjects/:subjectAssignmentId', removeSubjectFromBatch)
router.post('/batches/:id/subjects/:subjectAssignmentId/teachers', assignTeacherValidator, validate, assignTeacherToSubject)
router.delete('/batches/:id/subjects/:subjectAssignmentId/teachers/:tutorId', unassignTeacherFromSubject)
router.post('/batches/:id/subjects/:subjectAssignmentId/schedule', scheduleSlotValidator, validate, addScheduleSlot)
router.delete('/batches/:id/subjects/:subjectAssignmentId/schedule/:slotId', removeScheduleSlot)

router.get('/students', getStudents)
router.post('/students', createStudentValidator, validate, createStudent)
router.delete('/students/:id', deleteStudent)
router.get('/students/:id/performance', getStudentPerformance)
router.get('/students/:id/dashboard/stats',        adminStudentAccess, getStudentDashStats)
router.get('/students/:id/dashboard/activity',      adminStudentAccess, getStudentDashActivity)
router.get('/students/:id/dashboard/achievements',  adminStudentAccess, getStudentDashAchievements)
router.get('/students/:id/dashboard/performance',   adminStudentAccess, getStudentDashPerformance)
router.get('/students/:id/dashboard/answers',       adminStudentAccess, getStudentDashAnswers)
router.get('/students/:id/dashboard/rounds',        adminStudentAccess, getStudentDashRounds)

router.get('/parents', getParents)
router.post('/parents', createParentValidator, validate, createParent)

module.exports = router
