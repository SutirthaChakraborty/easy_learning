const SAOrganization = require('../models/superadmin/Organization')
const AdminOrganization = require('../models/admin/Organization')
const GlobalSettings = require('../models/superadmin/GlobalSettings')

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
    const saOrg = await SAOrganization.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), approvedBy: process.env.SUPER_ADMIN_EMAIL },
      { new: true }
    )
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    // Sync approval to admin DB
    if (saOrg.adminOrgId) {
      await AdminOrganization.findByIdAndUpdate(saOrg.adminOrgId, { status: 'approved' })
    }

    res.json({ success: true, org: saOrg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const rejectOrg = async (req, res) => {
  try {
    const { reason } = req.body
    const saOrg = await SAOrganization.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || '' },
      { new: true }
    )
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    if (saOrg.adminOrgId) {
      await AdminOrganization.findByIdAndUpdate(saOrg.adminOrgId, { status: 'rejected', rejectionReason: reason || '' })
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
    res.json({ success: true, org: saOrg })
  } catch (err) {
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
    if (!key || value === undefined) return res.status(400).json({ success: false, message: 'key and value are required' })
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

module.exports = { getOrganizations, approveOrg, rejectOrg, updateSubscription, getStats, getSettings, upsertSetting }
