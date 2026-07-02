const express = require('express')
const router = express.Router()
const { setSession, getSession, clearSession, register, login } = require('../controllers/authController')

// Firebase / Google OAuth session cookie routes
router.post('/session', setSession)
router.get('/session', getSession)
router.delete('/session', clearSession)

// Manual JWT auth routes
router.post('/register', register)
router.post('/login', login)

module.exports = router
