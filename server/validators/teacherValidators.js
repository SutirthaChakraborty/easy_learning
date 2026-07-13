const { body } = require('express-validator')
const { MODULES, SUBJECTS } = require('../utils/questionModels')

const uploadQuestionsValidator = [
  body('module').trim().notEmpty().withMessage('Module is required')
    .isIn(MODULES).withMessage(`Module must be one of: ${MODULES.join(', ')}`),
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isIn(SUBJECTS).withMessage(`Subject must be one of: ${SUBJECTS.join(', ')}`),
]

module.exports = { uploadQuestionsValidator }
