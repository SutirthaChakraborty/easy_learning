const express = require('express')
const router  = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  logSession,
  getStats,
  getActivity,
  getAchievements,
  getPerformance,
} = require('../controllers/dashboardController')

router.use(dashboardAuth)

router.post('/log-session',  logSession)
router.get('/stats',         getStats)
router.get('/activity',      getActivity)
router.get('/achievements',  getAchievements)
router.get('/performance',   getPerformance)

module.exports = router
