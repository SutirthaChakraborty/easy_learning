const express = require('express')
const router = express.Router()
const validate = require('../middleware/validate')
const { uploadContactAttachment, handleUpload } = require('../middleware/upload')
const { contactValidator } = require('../validators/contactValidators')
const { createContactMessage } = require('../controllers/contactController')

router.post('/', handleUpload(uploadContactAttachment.single('attachment')), contactValidator, validate, createContactMessage)

module.exports = router
