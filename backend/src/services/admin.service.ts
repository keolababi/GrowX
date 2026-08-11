import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') throw new HttpError(403, 'Admin эрх шаардлагатай.');
}

export async function listUsers(adminId: string, query?: string) {
  await requireAdmin(adminId);
  const search = query?.trim();
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { profile: { displayName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  });

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      isMe: user.id === adminId,
    })),
  };
}

export async function updateUserRole(adminId: string, targetUserId: string, role: UserRole) {
  await requireAdmin(adminId);
  if (adminId === targetUserId) {
    throw new HttpError(400, 'Өөрийн admin эрхийг өөрчлөх боломжгүй.');
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!target) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  return { user };
}
