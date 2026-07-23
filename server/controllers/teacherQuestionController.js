const path = require('path')
const ExcelJS = require('exceljs')
const Counter = require('../models/Counter')
const Organization = require('../models/admin/Organization')
const Batch = require('../models/admin/Batch')
const QuestionUploadBatch = require('../models/superadmin/QuestionUploadBatch')
const { getQuestionModel, MODULES, SUBJECTS } = require('../utils/questionModels')
const { validateRow } = require('../utils/questionValidation')
const { fileUrl, saveBufferToUploads } = require('../middleware/upload')

const TEMPLATE_DIR = path.join(__dirname, '../templates/questions')
const MAX_ROWS = 500

const PROTECTED_QUESTION_FIELDS = new Set(['_id', 'id', 'status', 'submittedBy', 'uploadBatchId', 'createdAt', 'updatedAt', '__v'])

// GET /api/teacher/questions/template?module=&subject=
const getQuestionTemplate = (req, res) => {
  const module = String(req.query.module || '').toLowerCase()
  const subject = String(req.query.subject || '').toLowerCase()
  if (!MODULES.includes(module) || !SUBJECTS.includes(subject)) {
    return res.status(400).json({ success: false, message: 'Invalid module or subject' })
  }
  const filePath = path.join(TEMPLATE_DIR, `${module}-${subject}.xlsx`)
  res.download(filePath, `${module}-${subject}-template.xlsx`, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, message: 'Template not found' })
  })
}

function cellToValue(v) {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') {
    if (v.text !== undefined) return v.text
    if (v.result !== undefined) return v.result
    return ''
  }
  return v
}

// POST /api/teacher/questions/upload — multipart: file, module, subject
const uploadQuestions = async (req, res) => {
  try {
    const module = String(req.body.module || '').toLowerCase()
    const subject = String(req.body.subject || '').toLowerCase()
    const Model = getQuestionModel(module, subject)
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid module or subject' })
    if (!req.file) return res.status(400).json({ success: false, message: 'An .xlsx file is required' })

    // batchIds is validated/parsed into an array by uploadQuestionsValidator. Only allow
    // targeting batches this teacher is actually assigned to, in their own org.
    const requestedBatchIds = req.body.batchIds
    const assignedBatches = await Batch.find({
      _id: { $in: requestedBatchIds }, orgId: req.teacher.orgId, tutorIds: req.teacher.id,
    }).select('_id')
    if (assignedBatches.length !== requestedBatchIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected batches are not assigned to you' })
    }
    const batchIds = assignedBatches.map((b) => b._id.toString())

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(req.file.buffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) return res.status(400).json({ success: false, message: 'The uploaded file has no sheets' })

    const headers = []
    sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = String(cellToValue(cell.value)).trim().toLowerCase()
    })

    const parsedRows = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const rowObj = {}
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber]
        if (header) rowObj[header] = cellToValue(cell.value)
      })
      parsedRows.push({ rowNumber, rowObj })
    })

    if (parsedRows.length > MAX_ROWS) {
      return res.status(400).json({ success: false, message: `A single upload may contain at most ${MAX_ROWS} rows` })
    }

    const validRows = []
    const rowErrors = []
    for (const { rowNumber, rowObj } of parsedRows) {
      const result = validateRow(module, subject, rowObj, rowNumber)
      if (result.blank) continue
      if (result.errors) { rowErrors.push(...result.errors); continue }
      validRows.push(result.data)
    }

    if (validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows found in the uploaded file', rowErrors })
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: Model.modelName },
      { $inc: { seq: validRows.length } },
      { upsert: true, new: true }
    )
    const startId = counter.seq - validRows.length + 1

    const org = await Organization.findById(req.teacher.orgId)

    const filename = saveBufferToUploads('question-uploads', req.file.buffer, req.file.originalname)
    const originalFileUrl = fileUrl(req, 'question-uploads', filename)

    const batch = await QuestionUploadBatch.create({
      module, subject,
      submittedByTutorId: req.teacher.id,
      submittedByName: req.teacher.name || '',
      submittedByEmail: req.teacher.email,
      orgId: req.teacher.orgId,
      orgName: org?.name || '',
      batchIds,
      originalFilename: req.file.originalname,
      originalFileUrl,
      rowCount: validRows.length,
      skippedRowCount: rowErrors.length,
      rowErrors,
    })

    const docs = validRows.map((data, i) => ({
      ...data,
      id: startId + i,
      status: 'pending',
      submittedBy: req.teacher.id,
      uploadBatchId: batch._id,
    }))
    await Model.insertMany(docs)

    res.status(201).json({
      success: true,
      batchId: batch._id,
      insertedCount: validRows.length,
      skippedCount: rowErrors.length,
      rowErrors,
    })
  } catch (err) {
    console.error('uploadQuestions error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/teacher/questions/uploads
const getMyUploadBatches = async (req, res) => {
  try {
    const batches = await QuestionUploadBatch.find({ submittedByTutorId: req.teacher.id }).sort({ createdAt: -1 })
    res.json({ success: true, batches })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/teacher/questions/uploads/:id
const getMyUploadBatchDetail = async (req, res) => {
  try {
    const batch = await QuestionUploadBatch.findOne({ _id: req.params.id, submittedByTutorId: req.teacher.id })
    if (!batch) return res.status(404).json({ success: false, message: 'Upload batch not found' })

    const Model = getQuestionModel(batch.module, batch.subject)
    const rows = Model ? await Model.find({ uploadBatchId: batch._id }).sort({ id: 1 }) : []
    res.json({ success: true, batch, rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// PATCH /api/teacher/questions/:module/:subject/:id — only questions this teacher submitted
const updateQuestion = async (req, res) => {
  try {
    const Model = getQuestionModel(req.params.module, req.params.subject)
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid module or subject' })

    const question = await Model.findOne({ _id: req.params.id, submittedBy: req.teacher.id })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })

    for (const [key, value] of Object.entries(req.body)) {
      if (PROTECTED_QUESTION_FIELDS.has(key)) continue
      if (!Model.schema.path(key)) continue
      question[key] = value
    }
    await question.save()

    res.json({ success: true, question })
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message })
    console.error('updateQuestion error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { getQuestionTemplate, uploadQuestions, getMyUploadBatches, getMyUploadBatchDetail, updateQuestion }
