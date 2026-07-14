const express = require('express')
const router = express.Router()
const { dashboardAuth } = require('../middleware/authMiddleware')
const {
  getAllPrompts,
  getPromptById,
  seedPrompts,
  deleteAllPrompts
} = require('../controllers/speakScienceController')

router.post('/seed', seedPrompts)
router.get('/', dashboardAuth, getAllPrompts)
router.get('/:id', dashboardAuth, getPromptById)
router.delete('/all', deleteAllPrompts)

module.exports = router
