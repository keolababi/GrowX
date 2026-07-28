import type { Request, Response } from 'express';
import { z } from 'zod';
import * as socialService from '../services/social.service.js';

const userIdSchema = z.object({ userId: z.string().min(1) });

export async function profile(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  res.status(200).json(await socialService.getSocialProfile(req.auth!.userId, userId));
}

export async function toggleFollow(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  res.status(200).json(await socialService.toggleFollow(req.auth!.userId, userId));
}

export async function followers(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  res.status(200).json(await socialService.listFollowers(req.auth!.userId, userId));
}

export async function following(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  res.status(200).json(await socialService.listFollowing(req.auth!.userId, userId));
}
