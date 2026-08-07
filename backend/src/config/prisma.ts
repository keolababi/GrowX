import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = new URL(env.DATABASE_URL);

// Keep local hot reloads and browser polling from exhausting Neon's direct connection pool.
if (!databaseUrl.searchParams.has('connection_limit')) {
  databaseUrl.searchParams.set('connection_limit', env.NODE_ENV === 'development' ? '5' : '10');
}
if (!databaseUrl.searchParams.has('pool_timeout')) {
  databaseUrl.searchParams.set('pool_timeout', '20');
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl.toString() });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
