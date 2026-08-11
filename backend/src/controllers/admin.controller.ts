import type { Request, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service.js';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});
const userIdSchema = z.object({ userId: z.string().min(1) });
const roleSchema = z.object({ role: z.enum(['USER', 'ADMIN']) });

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { q } = listQuerySchema.parse(req.query);
  res.status(200).json(await adminService.listUsers(req.auth!.userId, q));
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  const { role } = roleSchema.parse(req.body);
  res.status(200).json(await adminService.updateUserRole(req.auth!.userId, userId, role));
}
