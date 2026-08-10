const jwt = require('jsonwebtoken')

const parentAuth = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.PARENT_JWT_SECRET)
    req.parent = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

module.exports = parentAuth
