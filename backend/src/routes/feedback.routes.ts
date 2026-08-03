import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const feedbackRouter = Router();

feedbackRouter.use(requireAuth);
feedbackRouter.get('/', asyncHandler(feedbackController.listMyForms));
feedbackRouter.post('/', asyncHandler(feedbackController.createForm));
feedbackRouter.get('/:formId', asyncHandler(feedbackController.getForm));
feedbackRouter.delete('/:formId', asyncHandler(feedbackController.deleteForm));
feedbackRouter.post('/:formId/responses', asyncHandler(feedbackController.submitResponse));
feedbackRouter.get('/:formId/responses', asyncHandler(feedbackController.listResponses));
