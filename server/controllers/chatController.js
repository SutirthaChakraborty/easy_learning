const SAOrganization = require('../models/superadmin/Organization')
const ChatMessage = require('../models/superadmin/ChatMessage')

// ── Admin side ─────────────────────────────────────────────────────────────────

const getMyThread = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ adminUid: req.admin.uid }).sort({ createdAt: 1 })
    await ChatMessage.updateMany(
      { adminUid: req.admin.uid, senderRole: 'superadmin', readByAdmin: false },
      { readByAdmin: true }
    )
    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const sendMyMessage = async (req, res) => {
  try {
    const { message } = req.body
    const saOrg = await SAOrganization.findOne({ adminUid: req.admin.uid })
    const msg = await ChatMessage.create({
      adminUid: req.admin.uid,
      orgName: saOrg?.name || req.admin.name || '',
      senderRole: 'admin',
      message,
      readByAdmin: true,
      readBySuperadmin: false,
    })
    res.status(201).json({ success: true, message: msg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getMyUnreadCount = async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({ adminUid: req.admin.uid, senderRole: 'superadmin', readByAdmin: false })
    res.json({ success: true, count })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Super admin side ─────────────────────────────────────────────────────────

const listConversations = async (req, res) => {
  try {
    const rows = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$adminUid',
          orgName: { $first: '$orgName' },
          lastMessage: { $first: '$message' },
          lastSenderRole: { $first: '$senderRole' },
          lastAt: { $first: '$createdAt' },
          unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$senderRole', 'admin'] }, { $eq: ['$readBySuperadmin', false] }] }, 1, 0] } },
        } },
      { $sort: { lastAt: -1 } },
    ])

    const orgs = await SAOrganization.find({ adminUid: { $in: rows.map((r) => r._id) } }).select('adminUid name status')
    const orgByUid = Object.fromEntries(orgs.map((o) => [o.adminUid, o]))

    const conversations = rows.map((r) => ({
      adminUid: r._id,
      orgName: orgByUid[r._id]?.name || r.orgName,
      orgStatus: orgByUid[r._id]?.status || null,
      orgId: orgByUid[r._id]?._id || null,
      lastMessage: r.lastMessage,
      lastSenderRole: r.lastSenderRole,
      lastAt: r.lastAt,
      unreadCount: r.unreadCount,
    }))

    res.json({ success: true, conversations })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrgThread = async (req, res) => {
  try {
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    const messages = await ChatMessage.find({ adminUid: saOrg.adminUid }).sort({ createdAt: 1 })
    await ChatMessage.updateMany(
      { adminUid: saOrg.adminUid, senderRole: 'admin', readBySuperadmin: false },
      { readBySuperadmin: true }
    )
    res.json({ success: true, messages, orgName: saOrg.name })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const sendOrgMessage = async (req, res) => {
  try {
    const { message } = req.body
    const saOrg = await SAOrganization.findById(req.params.id)
    if (!saOrg) return res.status(404).json({ success: false, message: 'Organization not found' })

    const msg = await ChatMessage.create({
      adminUid: saOrg.adminUid,
      orgName: saOrg.name,
      senderRole: 'superadmin',
      message,
      readByAdmin: false,
      readBySuperadmin: true,
    })
    res.status(201).json({ success: true, message: msg })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getTotalUnreadCount = async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({ senderRole: 'admin', readBySuperadmin: false })
    res.json({ success: true, count })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {
  getMyThread, sendMyMessage, getMyUnreadCount,
  listConversations, getOrgThread, sendOrgMessage, getTotalUnreadCount,
}
