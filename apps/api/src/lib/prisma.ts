import { PrismaClient } from '@prisma/client';

// tsx watch re-executes this module on every file change in dev. Without
// caching the client on `globalThis`, each reload would create a new
// PrismaClient - and a new connection pool - without closing the old one,
// eventually exhausting Postgres's max_connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
