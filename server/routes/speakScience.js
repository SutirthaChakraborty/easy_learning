const express = require('express')
const router = express.Router()
const {
  getAllPrompts,
  getPromptById,
  seedPrompts,
  deleteAllPrompts
} = require('../controllers/speakScienceController')

router.post('/seed', seedPrompts)
router.get('/', getAllPrompts)
router.get('/:id', getPromptById)
router.delete('/all', deleteAllPrompts)

module.exports = router
