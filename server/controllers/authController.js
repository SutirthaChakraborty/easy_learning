const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ── Session cookie helpers (used by Firebase / Google OAuth flow) ─────────────

const COOKIE_NAME = 'user_session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

const setSession = (req, res) => {
  const { uid, email, name, photoURL } = req.body
  if (!uid || !email) {
    return res.status(400).json({ success: false, message: 'uid and email are required' })
  }

  const sessionData = { uid, email, name: name || '', photoURL: photoURL || '' }

  res.cookie(COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })

  res.json({ success: true, message: 'Session set' })
}

const getSession = (req, res) => {
  const raw = req.cookies[COOKIE_NAME]
  if (!raw) return res.json({ success: true, user: null })

  try {
    const user = JSON.parse(raw)
    res.json({ success: true, user })
  } catch {
    res.json({ success: true, user: null })
  }
}

const clearSession = (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' })
  res.json({ success: true, message: 'Session cleared' })
}

// ── Manual JWT auth (email / password) ───────────────────────────────────────

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { setSession, getSession, clearSession, register, login }
