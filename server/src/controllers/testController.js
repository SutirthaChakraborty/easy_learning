/**
 * Test Controller
 * Handles requests for the /api/test route.
 */

/**
 * GET /api/test
 * Returns a simple JSON payload confirming the API is live.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export function getTestMessage(req, res) {
  res.status(200).json({
    success: true,
    message: 'Easy Learn API is live 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}
