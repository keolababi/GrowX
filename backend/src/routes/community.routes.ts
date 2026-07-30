import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const communityRouter = Router();
communityRouter.use(requireAuth);
communityRouter.get('/', asyncHandler(communityController.list));
communityRouter.post('/', asyncHandler(communityController.create));
communityRouter.get('/:communityId', asyncHandler(communityController.getOne));
communityRouter.delete('/:communityId', asyncHandler(communityController.remove));
communityRouter.post(
  '/:communityId/membership',
  asyncHandler(communityController.toggleMembership),
);
communityRouter.get(
  '/:communityId/member-candidates',
  asyncHandler(communityController.memberCandidates),
);
communityRouter.post('/:communityId/members', asyncHandler(communityController.addMember));
communityRouter.delete(
  '/:communityId/members/:userId',
  asyncHandler(communityController.removeMember),
);
