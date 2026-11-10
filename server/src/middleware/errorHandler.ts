import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

export const apiNotFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // the JSON body parser marks the client's mistakes (broken JSON = 400, body too big = 413):
  // say what was wrong instead of a 500
  if (err.expose && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { message: 'Something went wrong on our side' } });
};
