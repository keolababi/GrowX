import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import * as uploadController from '../controllers/upload.controller.js';

export const uploadRouter = Router();
uploadRouter.post('/', asyncHandler(uploadController.upload));
