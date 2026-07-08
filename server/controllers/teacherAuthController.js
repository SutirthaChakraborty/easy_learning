const jwt = require('jsonwebtoken')
const Tutor = require('../models/admin/Tutor')

const signTeacherToken = (tutor) => jwt.sign(
  { id: tutor._id, uid: tutor.uid, email: tutor.email, name: tutor.name, orgId: tutor.orgId, role: 'teacher' },
  process.env.TEACHER_JWT_SECRET,
  { expiresIn: process.env.TEACHER_JWT_EXPIRES_IN || '7d' }
)

const googleSignIn = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body
    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'uid and email are required' })
    }

    const tutor = await Tutor.findOne({ email: email.toLowerCase() })
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'No teacher account found for this email. Ask your organization admin to add you first.' })
    }
    if (tutor.authStatus === 'disabled') {
      return res.status(403).json({ success: false, message: 'Your teacher account has been disabled. Contact your organization admin.' })
    }
    if (tutor.uid && tutor.uid !== uid) {
      return res.status(403).json({ success: false, message: 'This email is already linked to a different account.' })
    }

    tutor.uid = uid
    tutor.authStatus = 'active'
    tutor.photoURL = photoURL || tutor.photoURL
    tutor.name = name || tutor.name
    tutor.lastLoginAt = new Date()
    await tutor.save()

    const token = signTeacherToken(tutor)

    res.json({
      success: true,
      token,
      teacher: { id: tutor._id, uid: tutor.uid, email: tutor.email, name: tutor.name, photoURL: tutor.photoURL, orgId: tutor.orgId },
    })
  } catch (err) {
    console.error('teacherAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.teacher.id).populate('orgId', 'name')
    if (!tutor) return res.status(404).json({ success: false, message: 'Teacher not found' })
    res.json({ success: true, teacher: tutor })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { googleSignIn, getMe }
