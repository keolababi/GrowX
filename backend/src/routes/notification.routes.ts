import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get('/', asyncHandler(notificationController.list));
notificationRouter.get('/unread-count', asyncHandler(notificationController.unreadCount));
notificationRouter.patch('/read-all', asyncHandler(notificationController.markAllRead));
notificationRouter.patch('/:notificationId/read', asyncHandler(notificationController.markRead));
