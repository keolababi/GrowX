import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const registerSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(100).optional(),
});
const loginSchema = registerSchema.pick({ email: true, password: true });
const emailSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
});
const codeSchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) });
const resetSchema = codeSchema.extend({ password: z.string().min(8).max(72) });
const googleSchema = z.object({ idToken: z.string().min(1) });

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

export async function google(req: Request, res: Response): Promise<void> {
  res.status(200).json(await authService.googleSignIn(googleSchema.parse(req.body).idToken));
}
