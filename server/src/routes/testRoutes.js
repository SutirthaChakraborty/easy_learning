import { Router } from 'express';
import { getTestMessage } from '../controllers/testController.js';

const router = Router();

/**
 * @route   GET /api/test
 * @desc    Health-check — confirms the API is reachable
 * @access  Public
 */
router.get('/test', getTestMessage);

export default router;
