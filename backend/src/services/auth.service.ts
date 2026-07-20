import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { signAccessToken } from '../utils/jwt.js';

type RegisterInput = { email: string; password: string; displayName?: string };
type LoginInput = { email: string; password: string };

function serializeUser(user: { id: string; email: string; profile: { displayName: string | null } | null }) {
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
  return { user: serializeUser(user), token: signAccessToken({ userId: user.id, email: user.email }) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: { select: { displayName: true } } },
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password.');
  }
  return { user: serializeUser(user), token: signAccessToken({ userId: user.id, email: user.email }) };
}
