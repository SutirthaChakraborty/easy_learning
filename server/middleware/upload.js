const fs = require('fs')
const path = require('path')
const multer = require('multer')

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads')
const SUBFOLDERS = ['org-logos', 'avatars', 'contact-attachments']

SUBFOLDERS.forEach((folder) => {
  const dir = path.join(UPLOAD_ROOT, folder)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf']

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

const uploadOrgLogo = multer({
  storage: makeStorage('org-logos'),
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
  handleUpload,
  fileUrl,
}
