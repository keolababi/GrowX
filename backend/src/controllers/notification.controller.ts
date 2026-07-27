import type { Request, Response } from 'express';
import { z } from 'zod';
import * as notificationService from '../services/notification.service.js';

const notificationIdSchema = z.object({ notificationId: z.string().min(1) });

export async function list(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificationService.listNotifications(req.auth!.userId));
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificationService.getUnreadCount(req.auth!.userId));
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { notificationId } = notificationIdSchema.parse(req.params);
  res.status(200).json(await notificationService.markRead(req.auth!.userId, notificationId));
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificationService.markAllRead(req.auth!.userId));
}
