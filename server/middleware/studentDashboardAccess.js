const Organization   = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const Student        = require('../models/admin/Student')

// Authorizes an org admin to view one of their own students' learning dashboard,
// then swaps req.user to that student's identity so the existing dashboardController
// read handlers (which only ever read req.user.email) work unmodified.
const adminStudentAccess = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const student = await Student.findOne({ _id: req.params.id, orgId: org._id })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    if (!student.email) return res.status(404).json({ success: false, message: 'Student has no linked learning account' })

    req.user = { email: student.email, name: student.name }
    next()
  } catch (err) {
    console.error('adminStudentAccess error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Same, for the super admin drilling into an org's student.
const superadminStudentAccess = async (req, res, next) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg || !saOrg.adminOrgId) return res.status(404).json({ success: false, message: 'Organization not found' })

    const student = await Student.findOne({ _id: req.params.studentId, orgId: saOrg.adminOrgId })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    if (!student.email) return res.status(404).json({ success: false, message: 'Student has no linked learning account' })

    req.user = { email: student.email, name: student.name }
    next()
  } catch (err) {
    console.error('superadminStudentAccess error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { adminStudentAccess, superadminStudentAccess }
