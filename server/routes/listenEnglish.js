const express = require('express')
const router = express.Router()
const {
  getAllQuestions,
  getQuestionById,
  seedQuestions,
  deleteAllQuestions
} = require('../controllers/listenEnglishController')

router.post('/seed', seedQuestions)
router.get('/', getAllQuestions)
router.get('/:id', getQuestionById)
router.delete('/all', deleteAllQuestions)

module.exports = router
