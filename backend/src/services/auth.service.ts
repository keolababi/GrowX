import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { signAccessToken } from '../utils/jwt.js';
import { sendPasswordResetCode } from './mail.service.js';

type RegisterInput = { email: string; password: string; displayName?: string };
type LoginInput = { email: string; password: string };

function serializeUser(user: {
  id: string;
  email: string;
  profile: { displayName: string | null } | null;
}) {
  return { id: user.id, email: user.email, displayName: user.profile?.displayName ?? null };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      profile: { create: { displayName: input.displayName } },
    },
    include: { profile: { select: { displayName: true } } },
  });
  return {
    user: serializeUser(user),
    token: signAccessToken({ userId: user.id, email: user.email }),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: { select: { displayName: true } } },
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password.');
  }
  return {
    user: serializeUser(user),
    token: signAccessToken({ userId: user.id, email: user.email }),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: { select: { displayName: true } } },
  });
  if (!user) throw new HttpError(404, 'User not found.');
  return serializeUser(user);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If the account exists, a reset code has been sent.' };
  if (user.resetCodeHash && user.resetCodeExpiresAt && user.resetCodeExpiresAt > new Date()) {
    return { message: 'If the account exists, a reset code has been sent.' };
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCodeHash: await bcrypt.hash(code, 10),
      resetCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  try {
    await sendPasswordResetCode(user.email, code);
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCodeHash: null, resetCodeExpiresAt: null },
    });
    console.error('Failed to send password reset email:', error);
    throw new HttpError(503, 'Сэргээх код илгээж чадсангүй. Түр хүлээгээд дахин оролдоно уу.');
  }
  return { message: 'If the account exists, a reset code has been sent.' };
}

async function findValidReset(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user?.resetCodeHash &&
    user.resetCodeExpiresAt &&
    user.resetCodeExpiresAt > new Date() &&
    (await bcrypt.compare(code, user.resetCodeHash));
  if (!user || !valid) throw new HttpError(400, 'Reset code is invalid or expired.');
  return user;
}

export async function verifyResetCode(email: string, code: string) {
  await findValidReset(email, code);
  return { valid: true };
}

export async function resetPassword(email: string, code: string, password: string) {
  const user = await findValidReset(email, code);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      resetCodeHash: null,
      resetCodeExpiresAt: null,
    },
  });
  return { message: 'Password updated successfully.' };
}
