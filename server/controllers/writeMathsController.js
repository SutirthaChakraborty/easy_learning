const WriteMaths = require('../models/WriteMaths')
const { createQuestionController } = require('../utils/questionController')

module.exports = createQuestionController(WriteMaths, 'math_write.json', 'write', 'maths')
