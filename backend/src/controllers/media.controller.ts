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

export async function listPodcasts(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await mediaService.listPodcasts());
}

export async function createPodcast(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await mediaService.createPodcast(req.auth!.userId, podcastSchema.parse(req.body)));
}

export async function listReels(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await mediaService.listReels());
}

export async function createReel(req: Request, res: Response): Promise<void> {
  res.status(201).json(await mediaService.createReel(req.auth!.userId, reelSchema.parse(req.body)));
}

export async function removePodcast(req: Request, res: Response): Promise<void> {
  const podcastId = z.string().min(1).parse(req.params.podcastId);
  await mediaService.deletePodcast(req.auth!.userId, podcastId);
  res.status(204).send();
}
