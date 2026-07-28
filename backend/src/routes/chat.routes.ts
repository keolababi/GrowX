import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);
chatRouter.get('/users', asyncHandler(chatController.searchUsers));
chatRouter.get('/unread-count', asyncHandler(chatController.unreadCount));
chatRouter.get('/', asyncHandler(chatController.list));
chatRouter.post('/', asyncHandler(chatController.create));
chatRouter.get('/:conversationId/messages', asyncHandler(chatController.messages));
chatRouter.post('/:conversationId/messages', asyncHandler(chatController.send));
chatRouter.patch('/:conversationId/read', asyncHandler(chatController.markRead));
