const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads')
const SUBFOLDERS = ['avatars', 'contact-attachments', 'question-uploads']

SUBFOLDERS.forEach((folder) => {
  const dir = path.join(UPLOAD_ROOT, folder)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf']
const SPREADSHEET_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // some browsers/OSes misreport .xlsx as this — extension check below covers it
]

function makeStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, folder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
      cb(null, unique)
    },
  })
}

function imageFileFilter(req, file, cb) {
  if (!IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'))
  }
  cb(null, true)
}

function documentFileFilter(req, file, cb) {
  if (!DOCUMENT_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only images or PDF files are allowed'))
  }
  cb(null, true)
}

function spreadsheetFileFilter(req, file, cb) {
  const isXlsxExt = path.extname(file.originalname).toLowerCase() === '.xlsx'
  if (!isXlsxExt || !SPREADSHEET_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only .xlsx Excel files are allowed'))
  }
  cb(null, true)
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'org-logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
})

const uploadOrgLogo = multer({
  storage: cloudinaryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const uploadContactAttachment = multer({
  storage: makeStorage('contact-attachments'),
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
})

// Memory storage: the controller needs the raw bytes to parse+validate before
// deciding whether to keep an audit copy — see saveBufferToUploads() below.
const uploadQuestionSheet = multer({
  storage: multer.memoryStorage(),
  fileFilter: spreadsheetFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// Persists an in-memory upload buffer to disk after the controller has
// already validated it, using the same naming convention as makeStorage().
function saveBufferToUploads(subfolder, buffer, originalname) {
  const ext = path.extname(originalname).toLowerCase()
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  fs.writeFileSync(path.join(UPLOAD_ROOT, subfolder, filename), buffer)
  return filename
}

// Wraps a multer middleware so file-filter/size errors become JSON 400s instead of crashing/500ing
function handleUpload(uploader) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` })
      }
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'File upload failed' })
      }
      next()
    })
  }
}

function fileUrl(req, subfolder, filename) {
  if (!filename) return ''
  return `${req.protocol}://${req.get('host')}/uploads/${subfolder}/${filename}`
}

module.exports = {
  UPLOAD_ROOT,
  uploadOrgLogo,
  uploadAvatar,
  uploadContactAttachment,
  uploadQuestionSheet,
  handleUpload,
  fileUrl,
  saveBufferToUploads,
}
