import { Router } from 'express';
import * as lessonController from '../controllers/lesson.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const lessonRouter = Router();
lessonRouter.use(requireAuth);
lessonRouter.get('/', asyncHandler(lessonController.listLessons));
lessonRouter.get('/:lessonId', asyncHandler(lessonController.getLesson));
