import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.get('/users', asyncHandler(adminController.listUsers));
adminRouter.patch('/users/:userId/role', asyncHandler(adminController.updateUserRole));
