const Child = require('../models/Child')
const { getPerformanceForEmail } = require('../utils/performance')

const getChildren = async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.parent.id }).sort({ createdAt: -1 })
    res.json({ success: true, children })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createChild = async (req, res) => {
  try {
    const { name, email, age } = req.body

    const dup = await Child.findOne({ parentId: req.parent.id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A child with this email already exists' })

    const child = await Child.create({ parentId: req.parent.id, name, email, age })
    res.status(201).json({ success: true, child })
  } catch (err) {
    console.error('createChild error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateChild = async (req, res) => {
  try {
    const { name, email, age } = req.body

    if (email) {
      const dup = await Child.findOne({ parentId: req.parent.id, email: email.toLowerCase(), _id: { $ne: req.params.id } })
      if (dup) return res.status(409).json({ success: false, message: 'A child with this email already exists' })
    }

    const update = {}
    if (name !== undefined) update.name = name
    if (email !== undefined) update.email = email
    if (age !== undefined) update.age = age

    const child = await Child.findOneAndUpdate({ _id: req.params.id, parentId: req.parent.id }, update, { new: true, runValidators: true })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    res.json({ success: true, child })
  } catch (err) {
    console.error('updateChild error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteChild = async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({ _id: req.params.id, parentId: req.parent.id })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getChildPerformance = async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.id, parentId: req.parent.id })
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' })

    const performance = await getPerformanceForEmail(child.email)
    res.json({ success: true, child: { id: child._id, name: child.name, email: child.email }, performance })
  } catch (err) {
    console.error('getChildPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { getChildren, createChild, updateChild, deleteChild, getChildPerformance }
