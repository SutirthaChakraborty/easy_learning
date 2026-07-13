const express = require('express')
const router = express.Router()
const superadminAuth = require('../middleware/superadminAuth')
const validate = require('../middleware/validate')
const { superadminStudentAccess } = require('../middleware/studentDashboardAccess')
const {
  rejectOrgValidator, subscriptionValidator, settingValidator, respondContactValidator, sendChatMessageValidator,
  rejectUploadValidator,
} = require('../validators/superadminValidators')
const {
  getOrganizations, approveOrg, rejectOrg, updateSubscription,
  getOrgAdminDetail, getOrgStudents, getOrgTutors, getOrgStudentPerformance, getOrgTutorPerformance,
  getStats, getSettings, upsertSetting,
  getContactMessages, respondToContact,
} = require('../controllers/superadminController')
const {
  getUploadStats, getUploadBatches, getUploadBatchDetail, approveUploadBatch, rejectUploadBatch,
} = require('../controllers/questionReviewController')
const {
  getStats:        getStudentDashStats,
  getActivity:     getStudentDashActivity,
  getAchievements: getStudentDashAchievements,
  getPerformance:  getStudentDashPerformance,
  getAnswers:      getStudentDashAnswers,
  getRounds:       getStudentDashRounds,
} = require('../controllers/dashboardController')
const { listConversations, getOrgThread, sendOrgMessage, getTotalUnreadCount } = require('../controllers/chatController')

router.use(superadminAuth)

router.get('/stats', getStats)

router.get('/organizations', getOrganizations)
router.put('/organizations/:id/approve', approveOrg)
router.put('/organizations/:id/reject', rejectOrgValidator, validate, rejectOrg)
router.put('/organizations/:id/subscription', subscriptionValidator, validate, updateSubscription)

router.get('/organizations/:id/admin', getOrgAdminDetail)
router.get('/organizations/:id/students', getOrgStudents)
router.get('/organizations/:id/students/:studentId/performance', getOrgStudentPerformance)
router.get('/organizations/:id/students/:studentId/dashboard/stats',        superadminStudentAccess, getStudentDashStats)
router.get('/organizations/:id/students/:studentId/dashboard/activity',     superadminStudentAccess, getStudentDashActivity)
router.get('/organizations/:id/students/:studentId/dashboard/achievements', superadminStudentAccess, getStudentDashAchievements)
router.get('/organizations/:id/students/:studentId/dashboard/performance',  superadminStudentAccess, getStudentDashPerformance)
router.get('/organizations/:id/students/:studentId/dashboard/answers',      superadminStudentAccess, getStudentDashAnswers)
router.get('/organizations/:id/students/:studentId/dashboard/rounds',       superadminStudentAccess, getStudentDashRounds)
router.get('/organizations/:id/tutors', getOrgTutors)
router.get('/organizations/:id/tutors/:tutorId/performance', getOrgTutorPerformance)

router.get('/chat', listConversations)
router.get('/chat/unread-count', getTotalUnreadCount)
router.get('/chat/:id', getOrgThread)
router.post('/chat/:id', sendChatMessageValidator, validate, sendOrgMessage)

router.get('/settings', getSettings)
router.post('/settings', settingValidator, validate, upsertSetting)

router.get('/contact', getContactMessages)
router.put('/contact/:id', respondContactValidator, validate, respondToContact)

router.get('/question-uploads/stats', getUploadStats)
router.get('/question-uploads', getUploadBatches)
router.get('/question-uploads/:id', getUploadBatchDetail)
router.put('/question-uploads/:id/approve', approveUploadBatch)
router.put('/question-uploads/:id/reject', rejectUploadValidator, validate, rejectUploadBatch)

module.exports = router
