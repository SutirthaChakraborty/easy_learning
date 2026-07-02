const express = require('express')
const router = express.Router()
const { googleSignIn, getMe } = require('../controllers/adminAuthController')
const adminAuth = require('../middleware/adminAuth')

router.post('/google', googleSignIn)
router.get('/me', adminAuth, getMe)

module.exports = router
