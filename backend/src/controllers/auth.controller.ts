import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const registerSchema = z.object({
  email: z.string().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(100).optional(),
});
const loginSchema = registerSchema.pick({ email: true, password: true });

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(registerSchema.parse(req.body));
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(loginSchema.parse(req.body));
  res.status(200).json(result);
}
