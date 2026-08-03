import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { registerChatSocket } from './socket/chat.socket.js';

const httpServer = createServer(app);

const configuredOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      const isLocalDevelopmentOrigin =
        env.NODE_ENV === 'development' &&
        Boolean(
          origin &&
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin),
        );

      if (!origin || configuredOrigins.includes(origin) || isLocalDevelopmentOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error(`Socket origin not allowed: ${origin}`));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

registerChatSocket(io);

httpServer.listen(env.PORT, () => {
  console.info(`API and Socket.IO listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; closing server.`);

  io.close(() => {
    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
