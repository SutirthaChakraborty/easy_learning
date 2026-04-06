/**
 * Global Error-Handling Middleware
 *
 * Express recognises error handlers by their 4-argument signature (err, req, res, next).
 * Register this AFTER all routes in app.js.
 */

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  // Always log the full error on the server side
  console.error(`[${new Date().toISOString()}] ERROR ${status} — ${message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  res.status(status).json({
    success: false,
    message,
    // Only expose stack traces in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
