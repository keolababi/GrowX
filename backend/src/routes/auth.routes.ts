import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();
authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.post('/forgot-password', asyncHandler(authController.forgotPassword));
authRouter.post('/verify-reset-code', asyncHandler(authController.verifyResetCode));
authRouter.post('/reset-password', asyncHandler(authController.resetPassword));
