import { Router } from 'express';
import * as mediaController from '../controllers/media.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const mediaRouter = Router();
mediaRouter.use(requireAuth);
mediaRouter.get('/podcasts', asyncHandler(mediaController.listPodcasts));
mediaRouter.post('/podcasts', asyncHandler(mediaController.createPodcast));
mediaRouter.post('/podcasts/:podcastId/listen', asyncHandler(mediaController.listenPodcast));
mediaRouter.delete('/podcasts/:podcastId', asyncHandler(mediaController.removePodcast));
mediaRouter.get('/reels', asyncHandler(mediaController.listReels));
mediaRouter.get('/reels/mine', asyncHandler(mediaController.listMyReels));
mediaRouter.post('/reels', asyncHandler(mediaController.createReel));
mediaRouter.post('/reels/:reelId/like', asyncHandler(mediaController.toggleReelLike));
mediaRouter.get('/reels/:reelId/likes', asyncHandler(mediaController.listReelLikes));
mediaRouter.post('/reels/:reelId/share', asyncHandler(mediaController.shareReel));
mediaRouter.post('/reels/:reelId/comments', asyncHandler(mediaController.addReelComment));
mediaRouter.patch(
  '/reels/:reelId/comments/:commentId',
  asyncHandler(mediaController.updateReelComment),
);
mediaRouter.delete(
  '/reels/:reelId/comments/:commentId',
  asyncHandler(mediaController.removeReelComment),
);
