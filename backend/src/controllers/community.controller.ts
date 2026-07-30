import type { Request, Response } from 'express';
import { z } from 'zod';
import * as communityService from '../services/community.service.js';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  coverUrl: z.string().url().optional(),
});
const communityIdSchema = z.object({ communityId: z.string().min(1) });
const memberParamsSchema = communityIdSchema.extend({ userId: z.string().min(1) });
const addMemberSchema = z.object({ userId: z.string().min(1) });

export async function list(req: Request, res: Response): Promise<void> {
  res.status(200).json(await communityService.listCommunities(req.auth!.userId));
}

export async function create(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await communityService.createCommunity(req.auth!.userId, createSchema.parse(req.body)));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { communityId } = communityIdSchema.parse(req.params);
  res.status(200).json(await communityService.getCommunity(req.auth!.userId, communityId));
}

export async function toggleMembership(req: Request, res: Response): Promise<void> {
  const { communityId } = communityIdSchema.parse(req.params);
  res.status(200).json(await communityService.toggleMembership(req.auth!.userId, communityId));
}

export async function memberCandidates(req: Request, res: Response): Promise<void> {
  const { communityId } = communityIdSchema.parse(req.params);
  const query = z.string().trim().max(100).catch('').parse(req.query.q);
  res
    .status(200)
    .json(await communityService.searchMemberCandidates(req.auth!.userId, communityId, query));
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const { communityId } = communityIdSchema.parse(req.params);
  const { userId } = addMemberSchema.parse(req.body);
  res
    .status(201)
    .json(await communityService.addCommunityMember(req.auth!.userId, communityId, userId));
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const { communityId, userId } = memberParamsSchema.parse(req.params);
  await communityService.removeCommunityMember(req.auth!.userId, communityId, userId);
  res.status(204).send();
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { communityId } = communityIdSchema.parse(req.params);
  await communityService.deleteCommunity(req.auth!.userId, communityId);
  res.status(204).send();
}
