import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Invalid request data.', issues: error.flatten() });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
};
