const express = require('express')
const router = express.Router()
const parentAuth = require('../middleware/parentAuth')
const validate = require('../middleware/validate')
const { parentChildAccess } = require('../middleware/studentDashboardAccess')
const { createChildValidator, updateChildValidator } = require('../validators/parentValidators')
const { sendChatMessageValidator } = require('../validators/adminValidators')
const {
  getChildren, createChild, updateChild, deleteChild, getChildPerformance,
} = require('../controllers/parentController')
const {
  getStats:        getChildDashStats,
  getActivity:     getChildDashActivity,
  getAchievements: getChildDashAchievements,
  getPerformance:  getChildDashPerformance,
  getAnswers:      getChildDashAnswers,
  getRounds:       getChildDashRounds,
} = require('../controllers/dashboardController')
const { getMyParentThread, sendMyParentMessage, getMyParentUnreadCount } = require('../controllers/chatController')

router.use(parentAuth)

router.get('/children', getChildren)
router.post('/children', createChildValidator, validate, createChild)
router.patch('/children/:id', updateChildValidator, validate, updateChild)
router.delete('/children/:id', deleteChild)
router.get('/children/:id/performance', getChildPerformance)
router.get('/children/:id/dashboard/stats',        parentChildAccess, getChildDashStats)
router.get('/children/:id/dashboard/activity',      parentChildAccess, getChildDashActivity)
router.get('/children/:id/dashboard/achievements',  parentChildAccess, getChildDashAchievements)
router.get('/children/:id/dashboard/performance',   parentChildAccess, getChildDashPerformance)
router.get('/children/:id/dashboard/answers',       parentChildAccess, getChildDashAnswers)
router.get('/children/:id/dashboard/rounds',        parentChildAccess, getChildDashRounds)

router.get('/chat', getMyParentThread)
router.post('/chat', sendChatMessageValidator, validate, sendMyParentMessage)
router.get('/chat/unread-count', getMyParentUnreadCount)

module.exports = router
