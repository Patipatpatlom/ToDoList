import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton Instance
 *
 * In development environments, hot-reloading (e.g. tsx watch / nodemon) can cause
 * new instances of PrismaClient to be created on every reload, rapidly exhausting
 * database connection pool limits.
 *
 * Attaching the instance to `globalThis` preserves the singleton across module re-evaluations.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
