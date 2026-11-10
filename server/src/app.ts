import cors from 'cors';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

// no listen() here so tests can use the app directly
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  // one line per request, e.g. "GET /api/pings 200 4949 - 253.1 ms"
  // sent through our logger so all logs look the same
  app.use(morgan('tiny', { stream: { write: (line) => logger.info(line.trim()) } }));
  app.use('/api', apiRouter);
  app.use(errorHandler);

  return app;
}
