import type { Request, Response } from 'express';
import { z } from 'zod';
import * as chatService from '../services/chat.service.js';

const conversationIdSchema = z.object({ conversationId: z.string().min(1) });
const messageIdSchema = conversationIdSchema.extend({ messageId: z.string().min(1) });
const createSchema = z.object({ recipientId: z.string().min(1) });
const messageSchema = z.object({ content: z.string().trim().min(1).max(4000) });

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const query = z.string().max(100).catch('').parse(req.query.q);
  res.status(200).json(await chatService.searchUsers(req.auth!.userId, query));
}

export async function list(req: Request, res: Response): Promise<void> {
  res.status(200).json(await chatService.listConversations(req.auth!.userId));
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  res.status(200).json(await chatService.getUnreadCount(req.auth!.userId));
}

export async function create(req: Request, res: Response): Promise<void> {
  const { recipientId } = createSchema.parse(req.body);
  res.status(201).json(await chatService.createConversation(req.auth!.userId, recipientId));
}

export async function messages(req: Request, res: Response): Promise<void> {
  const { conversationId } = conversationIdSchema.parse(req.params);
  res.status(200).json(await chatService.listMessages(req.auth!.userId, conversationId));
}

export async function send(req: Request, res: Response): Promise<void> {
  const { conversationId } = conversationIdSchema.parse(req.params);
  const { content } = messageSchema.parse(req.body);
  res.status(201).json(await chatService.sendMessage(req.auth!.userId, conversationId, content));
}

export async function unsend(req: Request, res: Response): Promise<void> {
  const { conversationId, messageId } = messageIdSchema.parse(req.params);
  await chatService.unsendMessage(req.auth!.userId, conversationId, messageId);
  res.status(204).send();
}

export async function edit(req: Request, res: Response): Promise<void> {
  const { conversationId, messageId } = messageIdSchema.parse(req.params);
  const { content } = messageSchema.parse(req.body);
  res
    .status(200)
    .json(await chatService.editMessage(req.auth!.userId, conversationId, messageId, content));
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { conversationId } = conversationIdSchema.parse(req.params);
  res.status(200).json(await chatService.markRead(req.auth!.userId, conversationId));
}
