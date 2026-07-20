import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).none());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use(notFound);
app.use(errorHandler);
