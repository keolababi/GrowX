import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const authRouter = Router();
authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
