import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { JSON_BODY_LIMIT } from './config/constants.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

// no listen() here so tests can use the app directly
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  // one line per request, e.g. "GET /api/pings 200 4949 - 253.1 ms"
  // sent through our logger so all logs look the same
  app.use(morgan('tiny', { stream: { write: (line) => logger.info(line.trim()) } }));
  app.use('/api', apiRouter);

  // in the Docker image the built React app sits next to the server, so one process serves both
  const clientDist = path.join(import.meta.dirname, '../../client/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }
  app.use(errorHandler);

  return app;
}
