import { Router } from 'express';
import * as collaborationController from '../controllers/collaboration.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const collaborationRouter = Router();

collaborationRouter.use(requireAuth);
collaborationRouter.get('/received', asyncHandler(collaborationController.received));
collaborationRouter.get('/sent', asyncHandler(collaborationController.sent));
collaborationRouter.post('/:userId', asyncHandler(collaborationController.send));
collaborationRouter.patch('/:requestId/respond', asyncHandler(collaborationController.respond));
