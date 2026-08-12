import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { httpServer, io } from './http-server.js';

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
