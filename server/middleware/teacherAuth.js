const jwt = require('jsonwebtoken')

const teacherAuth = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.TEACHER_JWT_SECRET)
    if (payload.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    req.teacher = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

module.exports = teacherAuth
