const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  getAllQuestions,
  getQuestionById,
  seedQuestions,
  deleteAllQuestions
} = require('../controllers/listenEnglishController')

router.post('/seed', seedQuestions)
router.get('/', dashboardAuth, getAllQuestions)
router.get('/:id', dashboardAuth, getQuestionById)
router.delete('/all', deleteAllQuestions)

module.exports = router
