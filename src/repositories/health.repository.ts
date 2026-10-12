import { prisma } from '@/shared/db.js';

export class HealthRepository {
  async pingDatabase(): Promise<{ success: boolean; latencyMs: number }> {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Number((performance.now() - start).toFixed(2));
    return { success: true, latencyMs };
  }
}

export const healthRepository = new HealthRepository();
