import type { Request, Response } from 'express';
import { z } from 'zod';
import * as communityService from '../services/community.service.js';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  res.status(200).json(await communityService.listCommunities(req.auth!.userId));
}

export async function create(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await communityService.createCommunity(req.auth!.userId, createSchema.parse(req.body)));
}

export async function toggleMembership(req: Request, res: Response): Promise<void> {
  const communityId = z.string().min(1).parse(req.params.communityId);
  res.status(200).json(await communityService.toggleMembership(req.auth!.userId, communityId));
}
