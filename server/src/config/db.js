/**
 * Database Configuration
 *
 * This file exposes a db config object built from environment variables.
 * Replace the placeholder connect() function with the driver of your choice
 * (e.g. mongoose for MongoDB, pg/knex for PostgreSQL, mysql2 for MySQL).
 *
 * Example (MongoDB / Mongoose):
 *   import mongoose from 'mongoose';
 *   export async function connectDB() {
 *     await mongoose.connect(process.env.MONGO_URI);
 *     console.log('MongoDB connected ✅');
 *   }
 */

export const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'easy_learn',
  user:     process.env.DB_USER     || '',
  password: process.env.DB_PASSWORD || '',
};

/**
 * Placeholder — wire up your database driver here.
 * Call connectDB() from server.js before starting the server.
 */
export async function connectDB() {
  console.log('ℹ️  No database driver configured yet. See server/src/config/db.js.');
}
