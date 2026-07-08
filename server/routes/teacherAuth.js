const express = require('express')
const router = express.Router()
const { googleSignIn, getMe } = require('../controllers/teacherAuthController')
const teacherAuth = require('../middleware/teacherAuth')

router.post('/google', googleSignIn)
router.get('/me', teacherAuth, getMe)

module.exports = router
