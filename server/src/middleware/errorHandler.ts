import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

export const apiNotFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { message: 'Something went wrong on our side' } });
};
