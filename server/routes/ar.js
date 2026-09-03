const express = require('express')
const router  = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  logSession,
  logSessions,
  getSessions,
  getSession,
  getInsights,
  deleteMySessions,
} = require('../controllers/arController')

// dashboardAuth (not verifyToken) because the client's last-ditch flush uses
// navigator.sendBeacon, which cannot set an Authorization header — those
// requests authenticate with the Firebase session cookie instead.
router.use(dashboardAuth)

router.post('/session',       logSession)
router.post('/sessions',      logSessions)
router.get('/sessions',       getSessions)
router.get('/session/:id',    getSession)
router.get('/insights',       getInsights)
router.delete('/sessions',    deleteMySessions)

module.exports = router
