/**
 * Easy Learn — Server Entry Point
 * Futuresight Analytics Limited
 *
 * Loads environment variables, imports the configured Express app,
 * then starts listening on the specified port.
 */

import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `\n🚀 Easy Learn API  →  http://localhost:${PORT}\n` +
    `   Environment     :  ${process.env.NODE_ENV || 'development'}\n`
  );
});
