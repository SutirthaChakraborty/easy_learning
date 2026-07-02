const Organization = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const Tutor = require('../models/admin/Tutor')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const Batch = require('../models/admin/Batch')
const OrgAdmin = require('../models/admin/OrgAdmin')

// ── Organization ─────────────────────────────────────────────────────────────

const registerOrg = async (req, res) => {
  try {
    const { name, type, address, phone } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Organization name is required' })

    const existing = await Organization.findOne({ adminUid: req.admin.uid })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a registered organization', org: existing })
    }

    const org = await Organization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminUid: req.admin.uid,
    })

    // Mirror to super admin DB for approval
    await SAOrganization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminName: req.admin.name,
      adminUid: req.admin.uid, adminOrgId: org._id.toString(),
    })

    // Link org to admin
    await OrgAdmin.findByIdAndUpdate(req.admin.id, { orgId: org._id })

    res.status(201).json({ success: true, org })
  } catch (err) {
    console.error('registerOrg error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrg = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    res.json({ success: true, org })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Tutors ────────────────────────────────────────────────────────────────────

const getTutors = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, tutors: [] })
    const tutors = await Tutor.find({ orgId: org._id }).sort({ createdAt: -1 })
    res.json({ success: true, tutors })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createTutor = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, phone, subject } = req.body
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' })

    const tutor = await Tutor.create({ name, email, phone: phone || '', subject: subject || '', orgId: org._id })
    res.status(201).json({ success: true, tutor })
  } catch (err) {
    console.error('createTutor error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteTutor = async (req, res) => {
  try {
    await Tutor.findOneAndDelete({ _id: req.params.id, orgId: req.admin.orgId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Batches ───────────────────────────────────────────────────────────────────

const getBatches = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, batches: [] })
    const batches = await Batch.find({ orgId: org._id })
      .populate('tutorIds', 'name email')
      .populate('studentIds', 'name email')
      .sort({ createdAt: -1 })
    res.json({ success: true, batches })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, subject, description } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Batch name is required' })

    const batch = await Batch.create({ name, subject: subject || '', description: description || '', orgId: org._id })
    res.status(201).json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    await Batch.findOneAndDelete({ _id: req.params.id, orgId: org._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Students ──────────────────────────────────────────────────────────────────

const getStudents = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, students: [] })
    const students = await Student.find({ orgId: org._id }).sort({ createdAt: -1 })
    res.json({ success: true, students })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createStudent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, age, grade } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Student name is required' })

    const student = await Student.create({ name, email: email || '', age: age || null, grade: grade || '', orgId: org._id })
    res.status(201).json({ success: true, student })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteStudent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    await Student.findOneAndDelete({ _id: req.params.id, orgId: org._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Parents ───────────────────────────────────────────────────────────────────

const getParents = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, parents: [] })
    const parents = await Parent.find({ orgId: org._id }).populate('studentIds', 'name').sort({ createdAt: -1 })
    res.json({ success: true, parents })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createParent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, phone } = req.body
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' })

    const parent = await Parent.create({ name, email, phone: phone || '', orgId: org._id })
    res.status(201).json({ success: true, parent })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, stats: { tutors: 0, students: 0, batches: 0, parents: 0, org: null } })

    const [tutors, students, batches, parents] = await Promise.all([
      Tutor.countDocuments({ orgId: org._id }),
      Student.countDocuments({ orgId: org._id }),
      Batch.countDocuments({ orgId: org._id }),
      Parent.countDocuments({ orgId: org._id }),
    ])

    res.json({ success: true, stats: { tutors, students, batches, parents, org } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {
  registerOrg, getOrg,
  getTutors, createTutor, deleteTutor,
  getBatches, createBatch, deleteBatch,
  getStudents, createStudent, deleteStudent,
  getParents, createParent,
  getStats,
}
