import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'Authentication is required.');
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string' || !payload.sub && !payload.userId) {
      throw new HttpError(401, 'Invalid access token.');
    }
    const userId = typeof payload.userId === 'string' ? payload.userId : payload.sub;
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (!userId) throw new HttpError(401, 'Invalid access token.');
    req.auth = { userId, email };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired access token.'));
  }
}
