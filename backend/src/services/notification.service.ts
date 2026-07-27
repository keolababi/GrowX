import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const actorSelect = {
  id: true,
  email: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

export async function listNotifications(userId: string) {
  const [notifications, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: actorSelect } },
    }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map((notification) => ({
      ...notification,
      actor: notification.actor
        ? {
            id: notification.actor.id,
            email: notification.actor.email,
            displayName: notification.actor.profile?.displayName ?? null,
            avatarUrl: notification.actor.profile?.avatarUrl ?? null,
          }
        : null,
    })),
  };
}

export async function getUnreadCount(userId: string) {
  return {
    unreadCount: await prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    }),
  };
}

export async function markRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (!result.count) {
    const exists = await prisma.notification.findFirst({
      where: { id: notificationId, recipientId: userId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, 'Notification олдсонгүй.');
  }
  return { read: true };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { read: true };
}
