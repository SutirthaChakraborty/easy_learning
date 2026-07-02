const jwt = require('jsonwebtoken')

const login = (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  if (
    email !== process.env.SUPER_ADMIN_EMAIL ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { email, role: 'superadmin', name: 'Super Admin' },
    process.env.SUPERADMIN_JWT_SECRET,
    { expiresIn: process.env.SUPERADMIN_JWT_EXPIRES_IN || '1d' }
  )

  res.json({ success: true, token, superadmin: { email, name: 'Super Admin', role: 'superadmin' } })
}

module.exports = { login }
