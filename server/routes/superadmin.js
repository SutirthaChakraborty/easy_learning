const express = require('express')
const router = express.Router()
const superadminAuth = require('../middleware/superadminAuth')
const {
  getOrganizations, approveOrg, rejectOrg, updateSubscription,
  getStats, getSettings, upsertSetting,
} = require('../controllers/superadminController')

router.use(superadminAuth)

router.get('/stats', getStats)

router.get('/organizations', getOrganizations)
router.put('/organizations/:id/approve', approveOrg)
router.put('/organizations/:id/reject', rejectOrg)
router.put('/organizations/:id/subscription', updateSubscription)

router.get('/settings', getSettings)
router.post('/settings', upsertSetting)

module.exports = router
