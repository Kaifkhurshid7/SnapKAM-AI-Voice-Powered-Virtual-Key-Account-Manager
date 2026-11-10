import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/** Error carrying an HTTP status, for expected failures such as validation errors. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

/** Central error handler: never leaks internals to the client, logs details server-side. */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error('Unhandled error', {
    path: req.path,
    error: error instanceof Error ? error.message : String(error),
  });
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
