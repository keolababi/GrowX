import { Router } from 'express';
import * as socialController from '../controllers/social.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const socialRouter = Router();

socialRouter.use(requireAuth);
socialRouter.get('/:userId', asyncHandler(socialController.profile));
socialRouter.post('/:userId/follow', asyncHandler(socialController.toggleFollow));
socialRouter.get('/:userId/followers', asyncHandler(socialController.followers));
socialRouter.get('/:userId/following', asyncHandler(socialController.following));
