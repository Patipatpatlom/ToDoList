import { HealthRepository, healthRepository } from '@/repositories/health.repository.js';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
  };
}

export class HealthService {
  constructor(private readonly repo: HealthRepository = healthRepository) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptimeSeconds = Number(process.uptime().toFixed(2));
    const environment = process.env.NODE_ENV || 'development';

    try {
      const dbResult = await this.repo.pingDatabase();
      return {
        status: 'healthy',
        uptimeSeconds,
        timestamp,
        environment,
        database: {
          status: 'connected',
          latencyMs: dbResult.latencyMs,
        },
      };
    } catch {
      return {
        status: 'degraded',
        uptimeSeconds,
        timestamp,
        environment,
        database: {
          status: 'disconnected',
        },
      };
    }
  }
}

export const healthService = new HealthService();
