import { Router } from 'express';
import * as professionalController from '../controllers/professional.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const professionalRouter = Router();

professionalRouter.use(requireAuth);
professionalRouter.get('/applications/me', asyncHandler(professionalController.mine));
professionalRouter.get('/applications', asyncHandler(professionalController.list));
professionalRouter.post('/applications', asyncHandler(professionalController.submit));
professionalRouter.patch(
  '/applications/:applicationId/review',
  asyncHandler(professionalController.review),
);
