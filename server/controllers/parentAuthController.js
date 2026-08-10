const jwt = require('jsonwebtoken')
const ParentAccount = require('../models/ParentAccount')

const googleSignIn = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body
    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'uid and email are required' })
    }

    let parent = await ParentAccount.findOne({ uid })
    if (!parent) {
      parent = await ParentAccount.create({ uid, email, name: name || '', photoURL: photoURL || '' })
    } else {
      parent.name = name || parent.name
      parent.photoURL = photoURL || parent.photoURL
      await parent.save()
    }

    const token = jwt.sign(
      { id: parent._id, uid: parent.uid, email: parent.email, name: parent.name, role: 'parent' },
      process.env.PARENT_JWT_SECRET,
      { expiresIn: process.env.PARENT_JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      success: true,
      token,
      parent: { id: parent._id, uid: parent.uid, email: parent.email, name: parent.name, photoURL: parent.photoURL },
    })
  } catch (err) {
    console.error('parentAuth googleSignIn error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const parent = await ParentAccount.findById(req.parent.id)
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' })
    res.json({ success: true, parent })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { googleSignIn, getMe }
