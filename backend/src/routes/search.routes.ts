import { Router } from 'express';
import * as searchController from '../controllers/search.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const searchRouter = Router();
searchRouter.use(requireAuth);
searchRouter.get('/', asyncHandler(searchController.search));
