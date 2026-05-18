const express = require('express')
const router = express.Router()
const {
  getAllPrompts,
  getPromptById,
  seedPrompts,
  deleteAllPrompts
} = require('../controllers/speakEnglishController')

router.post('/seed', seedPrompts)
router.get('/', getAllPrompts)
router.get('/:id', getPromptById)
router.delete('/all', deleteAllPrompts)

module.exports = router
