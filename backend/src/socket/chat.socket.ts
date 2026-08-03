import jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import * as chatService from '../services/chat.service.js';

const conversationSchema = z.object({
  conversationId: z.string().min(1),
});

const messageSchema = conversationSchema.extend({
  content: z.string().trim().min(1).max(4000),
});

type AccessTokenPayload = {
  userId?: string;
  sub?: string;
};

async function isConversationMember(userId: string, conversationId: string): Promise<boolean> {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { userId: true },
  });

  return Boolean(member);
}

export function registerChatSocket(io: Server): void {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== 'string' || !token) {
        next(new Error('Authentication required.'));
        return;
      }

      const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
      const userId = payload.userId ?? payload.sub;
      if (!userId) {
        next(new Error('Invalid access token.'));
        return;
      }

      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Invalid or expired access token.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);

    socket.on('conversation:join', async (payload, callback) => {
      try {
        const { conversationId } = conversationSchema.parse(payload);
        if (!(await isConversationMember(userId, conversationId))) {
          callback?.({ ok: false, error: 'Conversation олдсонгүй.' });
          return;
        }

        await socket.join(`conversation:${conversationId}`);
        callback?.({ ok: true });
      } catch {
        callback?.({ ok: false, error: 'Conversation-д нэвтэрч чадсангүй.' });
      }
    });

    socket.on('conversation:leave', async (payload) => {
      const result = conversationSchema.safeParse(payload);
      if (result.success) {
        await socket.leave(`conversation:${result.data.conversationId}`);
      }
    });

    socket.on('message:send', async (payload, callback) => {
      try {
        const { conversationId, content } = messageSchema.parse(payload);
        const { message } = await chatService.sendMessage(userId, conversationId, content);

        io.to(`conversation:${conversationId}`).emit('message:new', message);
        const members = await prisma.conversationMember.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        await Promise.all(
          members.map(async (member) => {
            io.to(`user:${member.userId}`).emit('conversation:updated', { conversationId });
            const unread = await chatService.getUnreadCount(member.userId);
            io.to(`user:${member.userId}`).emit('unread:updated', unread);
          }),
        );
        callback?.({ ok: true, message });
      } catch (error) {
        callback?.({
          ok: false,
          error: error instanceof Error ? error.message : 'Мессеж илгээж чадсангүй.',
        });
      }
    });

    socket.on('message:read', async (payload, callback) => {
      try {
        const { conversationId } = conversationSchema.parse(payload);
        await chatService.markRead(userId, conversationId);

        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          readAt: new Date().toISOString(),
        });
        io.to(`user:${userId}`).emit('unread:updated', await chatService.getUnreadCount(userId));
        callback?.({ ok: true });
      } catch {
        callback?.({ ok: false, error: 'Уншсанаар тэмдэглэж чадсангүй.' });
      }
    });
  });
}
