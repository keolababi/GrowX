import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

const configuredOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
const isLocalDevelopmentOrigin = (origin: string) =>
  env.NODE_ENV === 'development' &&
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).none());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use(notFound);
app.use(errorHandler);
