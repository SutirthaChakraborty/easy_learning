const jwt = require('jsonwebtoken')
const OrgAdmin = require('../models/admin/OrgAdmin')

const googleSignIn = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body
    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'uid and email are required' })
    }

    let admin = await OrgAdmin.findOne({ uid })
    if (!admin) {
      admin = await OrgAdmin.create({ uid, email, name: name || '', photoURL: photoURL || '' })
    } else {
      admin.name = name || admin.name
      admin.photoURL = photoURL || admin.photoURL
      await admin.save()
    }

    const token = jwt.sign(
      { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, orgId: admin.orgId, role: 'org_admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      success: true,
      token,
      admin: { id: admin._id, uid: admin.uid, email: admin.email, name: admin.name, photoURL: admin.photoURL, orgId: admin.orgId },
    })
  } catch (err) {
    console.error('adminAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const admin = await OrgAdmin.findById(req.admin.id).populate('orgId')
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { googleSignIn, getMe }
