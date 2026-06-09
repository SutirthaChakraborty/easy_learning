const express = require('express')
const router  = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  logSession,
  getStats,
  getActivity,
  getAchievements,
  getPerformance,
  getModuleStars,
  logAnswer,
  getAnswers,
} = require('../controllers/dashboardController')

router.use(dashboardAuth)

router.post('/log-session',  logSession)
router.get('/stats',         getStats)
router.get('/activity',      getActivity)
router.get('/achievements',  getAchievements)
router.get('/performance',   getPerformance)
router.get('/module-stars',  getModuleStars)
router.post('/log-answer',   logAnswer)
router.get('/answers',       getAnswers)

module.exports = router
