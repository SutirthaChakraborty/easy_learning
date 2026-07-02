const jwt = require('jsonwebtoken')

const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET)
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

module.exports = adminAuth
