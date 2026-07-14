const { body } = require('express-validator')
const mongoose = require('mongoose')
const { MODULES, SUBJECTS } = require('../utils/questionModels')

const uploadQuestionsValidator = [
  body('module').trim().notEmpty().withMessage('Module is required')
    .isIn(MODULES).withMessage(`Module must be one of: ${MODULES.join(', ')}`),
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isIn(SUBJECTS).withMessage(`Subject must be one of: ${SUBJECTS.join(', ')}`),
  body('batchIds')
    .customSanitizer((value) => {
      if (Array.isArray(value)) return value
      try { return JSON.parse(value) } catch { return null }
    })
    .custom((value) => Array.isArray(value) && value.length > 0 && value.every((id) => mongoose.isValidObjectId(id)))
    .withMessage('Select at least one batch to upload these questions to'),
]

module.exports = { uploadQuestionsValidator }
