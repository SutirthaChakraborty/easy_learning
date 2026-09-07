const ReadMaths = require('../models/ReadMaths')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(ReadMaths, 'math_read.json', 'read', 'maths')
