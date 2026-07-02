const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// Accepts both JWT (Authorization header) and Firebase session cookie
const dashboardAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.user = { id: payload.id, email: payload.email, name: payload.name }
      return next()
    } catch (_) {}
  }

  const raw = req.cookies?.user_session
  if (raw) {
    try {
      const user = JSON.parse(raw)
      if (user?.email) {
        req.user = { id: user.uid, email: user.email, name: user.name || '' }
        return next()
      }
    } catch (_) {}
  }

  return res.status(401).json({ success: false, message: 'Unauthorized' })
}

module.exports = { verifyToken, dashboardAuth }
