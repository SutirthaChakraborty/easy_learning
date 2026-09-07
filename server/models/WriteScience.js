const mongoose = require('mongoose')
const { buildQuestionSchema } = require('./shared/questionSchema')

module.exports = mongoose.model('WriteScience', buildQuestionSchema())
