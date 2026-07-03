const SAOrganization = require('../models/superadmin/Organization')
const AdminOrganization = require('../models/admin/Organization')
const GlobalSettings = require('../models/superadmin/GlobalSettings')
const OrgAdmin = require('../models/admin/OrgAdmin')
const Student = require('../models/admin/Student')
const Tutor = require('../models/admin/Tutor')
const ContactMessage = require('../models/ContactMessage')
const { getPerformanceForEmail } = require('../utils/performance')

// ── Organizations ─────────────────────────────────────────────────────────────

const getOrganizations = async (req, res) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}
    const orgs = await SAOrganization.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, orgs })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const approveOrg = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    // Reversible: callable regardless of current status (pending/rejected/approved all flip to approved)
    saOrg.status = 'approved'
    saOrg.approvedAt = new Date()
    saOrg.approvedBy = process.env.SUPER_ADMIN_EMAIL
    saOrg.rejectionReason = ''
    await saOrg.save()

    if (saOrg.adminOrgId) {
      await AdminOrganization.findByIdAndUpdate(saOrg.adminOrgId, { status: 'approved', rejectionReason: '' })
    }

    res.json({ success: true, org: saOrg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const rejectOrg = async (req, res) => {
  try {
    const { reason } = req.body
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    // Reversible: callable regardless of current status (also doubles as a "suspend" action on an approved org)
    saOrg.status = 'rejected'
    saOrg.rejectionReason = reason
    saOrg.rejectionHistory.push({ reason, rejectedAt: new Date() })
    await saOrg.save()

    if (saOrg.adminOrgId) {
      await AdminOrganization.findByIdAndUpdate(saOrg.adminOrgId, {
        $set: { status: 'rejected', rejectionReason: reason },
        $push: { rejectionHistory: { reason, rejectedAt: new Date() } },
      })
    }

    res.json({ success: true, org: saOrg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateSubscription = async (req, res) => {
  try {
    const { plan, subscriptionStatus } = req.body
    const saOrg = await SAOrganization.findByIdAndUpdate(
      req.params.id,
      { ...(plan && { subscriptionPlan: plan }), ...(subscriptionStatus && { subscriptionStatus }) },
      { new: true }
    )
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })
    res.json({ success: true, org: saOrg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Approved org drill-down: admin identity, teachers, students, performance ──

const getOrgAdminDetail = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    const admin = await OrgAdmin.findOne({ uid: saOrg.adminUid })
      .select('name email phone designation designationOther photoURL')
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrgStudents = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg || !saOrg.adminOrgId) return res.json({ success: true, students: [] })

    const filter = { orgId: saOrg.adminOrgId }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const students = await Student.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, students })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrgTutors = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg || !saOrg.adminOrgId) return res.json({ success: true, tutors: [] })

    const filter = { orgId: saOrg.adminOrgId }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const tutors = await Tutor.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, tutors })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrgStudentPerformance = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg || !saOrg.adminOrgId) return res.status(404).json({ success: false, message: 'Organization not found' })

    const student = await Student.findOne({ _id: req.params.studentId, orgId: saOrg.adminOrgId })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    const performance = await getPerformanceForEmail(student.email)
    res.json({ success: true, student: { id: student._id, name: student.name, email: student.email }, performance })
  } catch (err) {
    console.error('getOrgStudentPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrgTutorPerformance = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg || !saOrg.adminOrgId) return res.status(404).json({ success: false, message: 'Organization not found' })

    const tutor = await Tutor.findOne({ _id: req.params.tutorId, orgId: saOrg.adminOrgId }).populate('studentIds', 'name email')
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' })

    const students = await Promise.all(
      (tutor.studentIds || []).map(async (s) => ({
        studentId: s._id, name: s.name, email: s.email,
        performance: await getPerformanceForEmail(s.email),
      }))
    )

    res.json({ success: true, tutor: { id: tutor._id, name: tutor.name, email: tutor.email }, students })
  } catch (err) {
    console.error('getOrgTutorPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      SAOrganization.countDocuments(),
      SAOrganization.countDocuments({ status: 'pending' }),
      SAOrganization.countDocuments({ status: 'approved' }),
      SAOrganization.countDocuments({ status: 'rejected' }),
    ])
    res.json({ success: true, stats: { totalOrgs: total, pendingOrgs: pending, approvedOrgs: approved, rejectedOrgs: rejected } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

const getSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.find()
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const upsertSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body
    const setting = await GlobalSettings.findOneAndUpdate(
      { key },
      { key, value, description: description || '' },
      { upsert: true, new: true }
    )
    res.json({ success: true, setting })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Contact messages ──────────────────────────────────────────────────────────

const getContactMessages = async (req, res) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const respondToContact = async (req, res) => {
  try {
    const { status, reply } = req.body
    const update = {}
    if (status) update.status = status
    if (reply !== undefined) { update.reply = reply; update.respondedAt = new Date() }

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    res.json({ success: true, message })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {
  getOrganizations, approveOrg, rejectOrg, updateSubscription,
  getOrgAdminDetail, getOrgStudents, getOrgTutors, getOrgStudentPerformance, getOrgTutorPerformance,
  getStats, getSettings, upsertSetting,
  getContactMessages, respondToContact,
}
