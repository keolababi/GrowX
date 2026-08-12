import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { registerChatSocket } from './socket/chat.socket.js';

const configuredOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

export const httpServer = createServer(app);

export const io = new Server(httpServer, {
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
