import type { Request, Response } from 'express';
import { z } from 'zod';
import * as collaborationService from '../services/collaboration.service.js';

const targetIdSchema = z.object({ userId: z.string().min(1) });
const requestIdSchema = z.object({ requestId: z.string().min(1) });
const sendSchema = z.object({ message: z.string().trim().min(1).max(500) });
const respondSchema = z.object({ accept: z.boolean() });

export async function send(req: Request, res: Response): Promise<void> {
  const { userId } = targetIdSchema.parse(req.params);
  const { message } = sendSchema.parse(req.body);
  res.status(201).json(await collaborationService.sendRequest(req.auth!.userId, userId, message));
}

export async function received(req: Request, res: Response): Promise<void> {
  res.status(200).json(await collaborationService.listReceivedRequests(req.auth!.userId));
}

export async function sent(req: Request, res: Response): Promise<void> {
  res.status(200).json(await collaborationService.listSentRequests(req.auth!.userId));
}

export async function respond(req: Request, res: Response): Promise<void> {
  const { requestId } = requestIdSchema.parse(req.params);
  const { accept } = respondSchema.parse(req.body);
  res
    .status(200)
    .json(await collaborationService.respondToRequest(req.auth!.userId, requestId, accept));
}
