const express = require('express')
const router = express.Router()
const superadminAuth = require('../middleware/superadminAuth')
const validate = require('../middleware/validate')
const { rejectOrgValidator, subscriptionValidator, settingValidator, respondContactValidator } = require('../validators/superadminValidators')
const {
  getOrganizations, approveOrg, rejectOrg, updateSubscription,
  getOrgAdminDetail, getOrgStudents, getOrgTutors, getOrgStudentPerformance, getOrgTutorPerformance,
  getStats, getSettings, upsertSetting,
  getContactMessages, respondToContact,
} = require('../controllers/superadminController')

router.use(superadminAuth)

router.get('/stats', getStats)

router.get('/organizations', getOrganizations)
router.put('/organizations/:id/approve', approveOrg)
router.put('/organizations/:id/reject', rejectOrgValidator, validate, rejectOrg)
router.put('/organizations/:id/subscription', subscriptionValidator, validate, updateSubscription)

router.get('/organizations/:id/admin', getOrgAdminDetail)
router.get('/organizations/:id/students', getOrgStudents)
router.get('/organizations/:id/students/:studentId/performance', getOrgStudentPerformance)
router.get('/organizations/:id/tutors', getOrgTutors)
router.get('/organizations/:id/tutors/:tutorId/performance', getOrgTutorPerformance)

router.get('/settings', getSettings)
router.post('/settings', settingValidator, validate, upsertSetting)

router.get('/contact', getContactMessages)
router.put('/contact/:id', respondContactValidator, validate, respondToContact)

module.exports = router
