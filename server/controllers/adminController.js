const Organization = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const Tutor = require('../models/admin/Tutor')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const Batch = require('../models/admin/Batch')
const OrgAdmin = require('../models/admin/OrgAdmin')
const { getPerformanceForEmail } = require('../utils/performance')
const { fileUrl } = require('../middleware/upload')

// ── Organization ─────────────────────────────────────────────────────────────

const registerOrg = async (req, res) => {
  try {
    const { name, type, address, phone, designation, designationOther } = req.body

    const existing = await Organization.findOne({ adminUid: req.admin.uid })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a registered organization', org: existing })
    }

    const logoUrl = req.file ? fileUrl(req, 'org-logos', req.file.filename) : ''

    const org = await Organization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminUid: req.admin.uid, logoUrl,
    })

    // Mirror to super admin DB for approval
    await SAOrganization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminName: req.admin.name,
      adminUid: req.admin.uid, adminOrgId: org._id.toString(), logoUrl,
      adminDesignation: designation === 'other' ? designationOther : designation,
    })

    // Link org to admin and record their declared identity
    await OrgAdmin.findByIdAndUpdate(req.admin.id, {
      orgId: org._id,
      designation: designation || '',
      designationOther: designation === 'other' ? (designationOther || '') : '',
      ...(phone ? { phone } : {}),
    })

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

// ── Admin identity / profile ─────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const admin = await OrgAdmin.findById(req.admin.id)
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { designation, designationOther, phone } = req.body
    const update = {}
    if (designation !== undefined) {
      update.designation = designation
      update.designationOther = designation === 'other' ? (designationOther || '') : ''
    }
    if (phone !== undefined) update.phone = phone
    if (req.file) update.photoURL = fileUrl(req, 'avatars', req.file.filename)

    const admin = await OrgAdmin.findByIdAndUpdate(req.admin.id, update, { new: true })
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })

    // Keep the mirrored super-admin org copy of the admin's designation in sync
    if (designation !== undefined) {
      const org = await Organization.findOne({ adminUid: req.admin.uid })
      if (org) {
        await SAOrganization.findOneAndUpdate(
          { adminOrgId: org._id.toString() },
          { adminDesignation: designation === 'other' ? designationOther : designation }
        )
      }
    }

    res.json({ success: true, admin })
  } catch (err) {
    console.error('updateProfile error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Tutors ────────────────────────────────────────────────────────────────────

const getTutors = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, tutors: [] })
    const filter = { orgId: org._id }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const tutors = await Tutor.find(filter).sort({ createdAt: -1 })
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

    const dup = await Tutor.findOne({ orgId: org._id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A tutor with this email already exists' })

    const tutor = await Tutor.create({ name, email, phone: phone || '', subject: subject || '', orgId: org._id })
    res.status(201).json({ success: true, tutor })
  } catch (err) {
    console.error('createTutor error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteTutor = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    await Tutor.findOneAndDelete({ _id: req.params.id, orgId: org._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getTutorPerformance = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const tutor = await Tutor.findOne({ _id: req.params.id, orgId: org._id }).populate('studentIds', 'name email')
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' })

    const students = await Promise.all(
      (tutor.studentIds || []).map(async (s) => ({
        studentId: s._id, name: s.name, email: s.email,
        performance: await getPerformanceForEmail(s.email),
      }))
    )

    res.json({ success: true, tutor: { id: tutor._id, name: tutor.name, email: tutor.email }, students })
  } catch (err) {
    console.error('getTutorPerformance error:', err)
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
    const batch = await Batch.create({ name, subject: subject || '', description: description || '', orgId: org._id })
    res.status(201).json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
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
    const filter = { orgId: org._id }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const students = await Student.find(filter).sort({ createdAt: -1 })
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

    if (email) {
      const dup = await Student.findOne({ orgId: org._id, email: email.toLowerCase() })
      if (dup) return res.status(409).json({ success: false, message: 'A student with this email already exists' })
    }

    const student = await Student.create({ name, email: email || '', age: age || null, grade: grade || '', orgId: org._id })
    res.status(201).json({ success: true, student })
  } catch (err) {
    console.error('createStudent error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteStudent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    await Student.findOneAndDelete({ _id: req.params.id, orgId: org._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getStudentPerformance = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const student = await Student.findOne({ _id: req.params.id, orgId: org._id })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    const performance = await getPerformanceForEmail(student.email)
    res.json({ success: true, student: { id: student._id, name: student.name, email: student.email }, performance })
  } catch (err) {
    console.error('getStudentPerformance error:', err)
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

    const dup = await Parent.findOne({ orgId: org._id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A parent with this email already exists' })

    const parent = await Parent.create({ name, email, phone: phone || '', orgId: org._id })
    res.status(201).json({ success: true, parent })
  } catch (err) {
    console.error('createParent error:', err)
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
  getProfile, updateProfile,
  getTutors, createTutor, deleteTutor, getTutorPerformance,
  getBatches, createBatch, deleteBatch,
  getStudents, createStudent, deleteStudent, getStudentPerformance,
  getParents, createParent,
  getStats,
}
