/**
 * Easy Learn — Express App Configuration
 * Registers middleware and routes, then exports the app instance.
 * server.js handles the actual `.listen()` call.
 */

import express from 'express';
import cors from 'cors';

import testRoutes from './routes/testRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security / CORS ───────────────────────────────────────────────────────────
// Allow requests only from the configured client origin.
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', testRoutes);

// ── 404 Catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be registered AFTER all routes.
app.use(errorHandler);

export default app;
