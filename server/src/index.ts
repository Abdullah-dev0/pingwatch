import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDb, pool } from './db/pool.js';
import { logger } from './lib/logger.js';
import { startPingJob } from './jobs/ping.job.js';

await initDb();

const server = createApp().listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});

const stopPingJob = startPingJob();

process.on('SIGTERM', () => {
  stopPingJob();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // SSE connections stay open forever, so close() would hang without this
  server.closeAllConnections();
});
