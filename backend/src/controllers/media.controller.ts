import type { Request, Response } from 'express';
import { z } from 'zod';
import * as mediaService from '../services/media.service.js';

const podcastSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  coverUrl: z.string().url(),
  audioUrl: z.string().url(),
  durationSec: z.number().int().nonnegative().optional(),
});
const reelSchema = z.object({
  caption: z.string().trim().max(1000).optional(),
  videoUrl: z.string().url(),
});
const reelUpdateSchema = z.object({
  caption: z.string().trim().max(1000).optional(),
});
const reelIdSchema = z.object({ reelId: z.string().min(1) });
const reelCommentIdSchema = reelIdSchema.extend({ commentId: z.string().min(1) });
const reelCommentSchema = z.object({ content: z.string().trim().min(1).max(1000) });

export async function listPodcasts(req: Request, res: Response): Promise<void> {
  res.status(200).json(await mediaService.listPodcasts(req.auth!.userId));
}

export async function listenPodcast(req: Request, res: Response): Promise<void> {
  const podcastId = z.string().min(1).parse(req.params.podcastId);
  res.status(200).json(await mediaService.recordPodcastListen(req.auth!.userId, podcastId));
}

export async function createPodcast(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await mediaService.createPodcast(req.auth!.userId, podcastSchema.parse(req.body)));
}

export async function listReels(req: Request, res: Response): Promise<void> {
  res.status(200).json(await mediaService.listReels(req.auth!.userId));
}

export async function listMyReels(req: Request, res: Response): Promise<void> {
  res.status(200).json(await mediaService.listMyReels(req.auth!.userId));
}

export async function createReel(req: Request, res: Response): Promise<void> {
  res.status(201).json(await mediaService.createReel(req.auth!.userId, reelSchema.parse(req.body)));
}

export async function updateReel(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  res
    .status(200)
    .json(
      await mediaService.updateReel(req.auth!.userId, reelId, reelUpdateSchema.parse(req.body)),
    );
}

export async function removeReel(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  await mediaService.deleteReel(req.auth!.userId, reelId);
  res.status(204).send();
}

export async function toggleReelLike(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  res.status(200).json(await mediaService.toggleReelLike(req.auth!.userId, reelId));
}

export async function listReelLikes(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  res.status(200).json(await mediaService.listReelLikes(reelId));
}

export async function shareReel(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  res.status(200).json(await mediaService.recordReelShare(reelId));
}

export async function addReelComment(req: Request, res: Response): Promise<void> {
  const { reelId } = reelIdSchema.parse(req.params);
  const { content } = reelCommentSchema.parse(req.body);
  res.status(201).json(await mediaService.addReelComment(req.auth!.userId, reelId, content));
}

export async function updateReelComment(req: Request, res: Response): Promise<void> {
  const { reelId, commentId } = reelCommentIdSchema.parse(req.params);
  const { content } = reelCommentSchema.parse(req.body);
  res
    .status(200)
    .json(await mediaService.updateReelComment(req.auth!.userId, reelId, commentId, content));
}

export async function removeReelComment(req: Request, res: Response): Promise<void> {
  const { reelId, commentId } = reelCommentIdSchema.parse(req.params);
  await mediaService.deleteReelComment(req.auth!.userId, reelId, commentId);
  res.status(204).send();
}

export async function removePodcast(req: Request, res: Response): Promise<void> {
  const podcastId = z.string().min(1).parse(req.params.podcastId);
  await mediaService.deletePodcast(req.auth!.userId, podcastId);
  res.status(204).send();
}
