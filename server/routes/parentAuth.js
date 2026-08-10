const express = require('express')
const router = express.Router()
const { googleSignIn, getMe } = require('../controllers/parentAuthController')
const parentAuth = require('../middleware/parentAuth')

router.post('/google', googleSignIn)
router.get('/me', parentAuth, getMe)

module.exports = router
