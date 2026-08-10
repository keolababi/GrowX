import type { AccountType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const MESSAGE_ACTION_WINDOW_MS = 10 * 60 * 1000;

const userSelect = {
  id: true,
  email: true,
  lastSeenAt: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
      bio: true,
      company: true,
      accountType: true,
      isMentor: true,
      industry: true,
    },
  },
} as const;

function serializeUser(user: {
  id: string;
  email: string;
  lastSeenAt: Date | null;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    company: string | null;
    accountType: AccountType;
    isMentor: boolean;
    industry: string | null;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    lastSeenAt: user.lastSeenAt,
    displayName: user.profile?.displayName ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? null,
    company: user.profile?.company ?? null,
    accountType: user.profile?.accountType ?? 'PERSONAL',
    isMentor: user.profile?.isMentor ?? false,
    industry: user.profile?.industry ?? null,
  };
}

async function requireMember(userId: string, conversationId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) throw new HttpError(404, 'Conversation олдсонгүй.');
  return member;
}

export async function searchUsers(userId: string, query: string, includeSelf = false) {
  const normalized = query.trim();
  const users = await prisma.user.findMany({
    where: {
      ...(includeSelf ? {} : { id: { not: userId } }),
      ...(normalized
        ? {
            OR: [
              { email: { contains: normalized, mode: 'insensitive' } },
              { profile: { displayName: { contains: normalized, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: userSelect,
  });
  return { users: users.map(serializeUser) };
}

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      members: { include: { user: { select: userSelect } } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return {
    conversations: await Promise.all(
      conversations
        .filter((conversation) => {
          const currentMember = conversation.members.find((member) => member.userId === userId)!;
          if (!currentMember.hiddenAt) return true;
          return conversation.updatedAt > currentMember.hiddenAt;
        })
        .map(async (conversation) => {
          const currentMember = conversation.members.find((member) => member.userId === userId)!;
          const otherMember = conversation.members.find((member) => member.userId !== userId);
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conversation.id,
              senderId: { not: userId },
              createdAt: { gt: currentMember.lastReadAt },
              deletedAt: null,
            },
          });
          return {
            id: conversation.id,
            updatedAt: conversation.updatedAt,
            otherUser: otherMember ? serializeUser(otherMember.user) : null,
            lastMessage: conversation.messages[0] ?? null,
            unreadCount,
          };
        }),
    ),
  };
}

export async function deleteConversation(userId: string, conversationId: string) {
  await requireMember(userId, conversationId);
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { hiddenAt: new Date() },
  });
  return { deleted: true };
}

export async function getUnreadCount(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  const counts = await Promise.all(
    memberships.map((member) =>
      prisma.message.count({
        where: {
          conversationId: member.conversationId,
          senderId: { not: userId },
          createdAt: { gt: member.lastReadAt },
          deletedAt: null,
        },
      }),
    ),
  );
  return { unreadCount: counts.reduce((total, count) => total + count, 0) };
}

export async function createConversation(userId: string, recipientId: string) {
  if (recipientId === userId) throw new HttpError(400, 'Өөртэйгөө chat эхлүүлэх боломжгүй.');
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });
  if (!recipient) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');

  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: { conversation: { include: { members: { select: { userId: true } } } } },
  });
  const existing = memberships.find(
    ({ conversation }) =>
      conversation.members.length === 2 &&
      conversation.members.some((member) => member.userId === recipientId),
  );
  if (existing) return { conversationId: existing.conversationId };

  const conversation = await prisma.conversation.create({
    data: {
      members: {
        create: [{ userId }, { userId: recipientId }],
      },
    },
  });
  return { conversationId: conversation.id };
}

export async function listMessages(userId: string, conversationId: string) {
  await requireMember(userId, conversationId);
  const [conversation, messages] = await prisma.$transaction([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          where: { userId: { not: userId } },
          take: 1,
          include: { user: { select: userSelect } },
        },
      },
    }),
    prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { sender: { select: userSelect } },
    }),
  ]);
  return {
    otherUser: conversation?.members[0] ? serializeUser(conversation.members[0].user) : null,
    otherLastReadAt: conversation?.members[0]?.lastReadAt ?? null,
    messages: messages.map((message) => ({
      ...message,
      sender: serializeUser(message.sender),
    })),
  };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
  clientMessageId?: string,
) {
  await requireMember(userId, conversationId);
  if (clientMessageId) {
    const existing = await prisma.message.findUnique({
      where: { clientMessageId },
      include: { sender: { select: userSelect } },
    });
    if (existing) {
      if (existing.senderId !== userId || existing.conversationId !== conversationId) {
        throw new HttpError(409, 'Message identifier already exists.');
      }
      return { message: { ...existing, sender: serializeUser(existing.sender) } };
    }
  }
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderId: userId, content, clientMessageId },
      include: { sender: { select: userSelect } },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });
  return { message: { ...message, sender: serializeUser(message.sender) } };
}

async function requireEditableMessage(userId: string, conversationId: string, messageId: string) {
  await requireMember(userId, conversationId);
  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId, deletedAt: null },
    select: { id: true, senderId: true, createdAt: true },
  });
  if (!message) throw new HttpError(404, 'Мессеж олдсонгүй.');
  if (message.senderId !== userId) {
    throw new HttpError(403, 'Зөвхөн өөрийн илгээсэн мессежийг өөрчлөх боломжтой.');
  }
  if (Date.now() - message.createdAt.getTime() > MESSAGE_ACTION_WINDOW_MS) {
    throw new HttpError(403, 'Мессеж засах эсвэл буцаах 10 минутын хугацаа дууссан.');
  }
  return message;
}

export async function editMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  content: string,
) {
  const message = await requireEditableMessage(userId, conversationId, messageId);
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content, editedAt: new Date() },
    include: { sender: { select: userSelect } },
  });
  return { message: { ...updated, sender: serializeUser(updated.sender) } };
}

export async function unsendMessage(userId: string, conversationId: string, messageId: string) {
  const message = await requireEditableMessage(userId, conversationId, messageId);
  await prisma.message.update({
    where: { id: message.id },
    data: { content: '', deletedAt: new Date() },
  });
}

export async function markRead(userId: string, conversationId: string) {
  await requireMember(userId, conversationId);
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  return { read: true };
}
