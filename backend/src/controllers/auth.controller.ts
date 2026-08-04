import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { prisma } from '../config/prisma.js';

const registerSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(100).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});
const emailSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
});
const codeSchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) });
const resetSchema = codeSchema.extend({ password: z.string().min(8).max(72) });
const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  company: z.string().trim().max(120).nullable().optional(),
  accountType: z.enum(['PERSONAL', 'BUSINESS']).optional(),
  isMentor: z.boolean().optional(),
  coverUrl: z.string().url().max(2048).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  services: z.string().trim().max(2000).nullable().optional(),
});

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(registerSchema.parse(req.body));
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(loginSchema.parse(req.body));
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({ user: await authService.getCurrentUser(req.auth!.userId) });
}

export async function heartbeat(req: Request, res: Response): Promise<void> {
  const lastSeenAt = new Date();
  await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { lastSeenAt },
  });
  res.status(200).json({ lastSeenAt });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = await authService.updateProfile(req.auth!.userId, profileSchema.parse(req.body));
  res.status(200).json({ user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  res.status(200).json(await authService.requestPasswordReset(emailSchema.parse(req.body).email));
}

export async function verifyResetCode(req: Request, res: Response): Promise<void> {
  const input = codeSchema.parse(req.body);
  res.status(200).json(await authService.verifyResetCode(input.email, input.code));
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = resetSchema.parse(req.body);
  res.status(200).json(await authService.resetPassword(input.email, input.code, input.password));
}
