import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const postRouter = Router();

postRouter.use(requireAuth);
postRouter.get('/', asyncHandler(postController.list));
postRouter.post('/', asyncHandler(postController.create));
postRouter.get('/user/:userId', asyncHandler(postController.listByUser));
postRouter.get('/:postId', asyncHandler(postController.getOne));
postRouter.get('/:postId/comments', asyncHandler(postController.listComments));
postRouter.post('/:postId/like', asyncHandler(postController.toggleLike));
postRouter.post('/:postId/comments', asyncHandler(postController.comment));
postRouter.delete('/:postId', asyncHandler(postController.remove));
