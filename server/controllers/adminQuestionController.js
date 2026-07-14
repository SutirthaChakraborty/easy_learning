const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
const { getQuestionModel } = require('../utils/questionModels')

// GET /api/admin/questions/uploads/stats
const getUploadStats = async (req, res) => {
  try {
    const orgId = String(req.admin.orgId)
    const [total, pending, approved, rejected] = await Promise.all([
      QuestionUploadBatch.countDocuments({ orgId }),
      QuestionUploadBatch.countDocuments({ orgId, status: 'pending' }),
      QuestionUploadBatch.countDocuments({ orgId, status: 'approved' }),
      QuestionUploadBatch.countDocuments({ orgId, status: 'rejected' }),
    ])
    res.json({ success: true, stats: { totalUploads: total, pendingUploads: pending, approvedUploads: approved, rejectedUploads: rejected } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/admin/questions/uploads?status=&module=&subject=
const getUploadBatches = async (req, res) => {
  try {
    const { status, module, subject } = req.query
    const filter = { orgId: String(req.admin.orgId) }
    if (status) filter.status = status
    if (module) filter.module = module
    if (subject) filter.subject = subject
    const batches = await QuestionUploadBatch.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, batches })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/admin/questions/uploads/:id
const getUploadBatchDetail = async (req, res) => {
  try {
    const batch = await QuestionUploadBatch.findOne({ _id: req.params.id, orgId: String(req.admin.orgId) })
    if (!batch) return res.status(404).json({ success: false, message: 'Upload batch not found' })

    const Model = getQuestionModel(batch.module, batch.subject)
    const rows = Model ? await Model.find({ uploadBatchId: batch._id }).sort({ id: 1 }) : []
    res.json({ success: true, batch, rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /api/admin/questions/uploads/:id/approve
const approveUploadBatch = async (req, res) => {
  try {
    const batch = await QuestionUploadBatch.findOne({ _id: req.params.id, orgId: String(req.admin.orgId) })
    if (!batch) return res.status(404).json({ success: false, message: 'Upload batch not found' })

    const Model = getQuestionModel(batch.module, batch.subject)
    if (!Model) return res.status(400).json({ success: false, message: 'Unknown module/subject' })

    // Reversible: callable regardless of current status (pending/rejected/approved all flip to approved)
    batch.status = 'approved'
    batch.reviewedAt = new Date()
    batch.reviewedBy = req.admin.email
    batch.rejectionReason = ''
    await batch.save()

    await Model.updateMany({ uploadBatchId: batch._id }, { $set: { status: 'approved' } })

    res.json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /api/admin/questions/uploads/:id/reject
const rejectUploadBatch = async (req, res) => {
  try {
    const { reason } = req.body
    const batch = await QuestionUploadBatch.findOne({ _id: req.params.id, orgId: String(req.admin.orgId) })
    if (!batch) return res.status(404).json({ success: false, message: 'Upload batch not found' })

    const Model = getQuestionModel(batch.module, batch.subject)
    if (!Model) return res.status(400).json({ success: false, message: 'Unknown module/subject' })

    // Reversible: callable regardless of current status (also doubles as a "pull back" action on an approved batch)
    batch.status = 'rejected'
    batch.reviewedAt = new Date()
    batch.reviewedBy = req.admin.email
    batch.rejectionReason = reason
    batch.rejectionHistory.push({ reason, rejectedAt: new Date() })
    await batch.save()

    await Model.updateMany({ uploadBatchId: batch._id }, { $set: { status: 'rejected' } })

    res.json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { getUploadStats, getUploadBatches, getUploadBatchDetail, approveUploadBatch, rejectUploadBatch }
