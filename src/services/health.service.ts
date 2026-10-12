import { HealthRepository, healthRepository } from '@/repositories/health.repository.js';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  db: 'connected' | 'disconnected';
  timestamp: string;
}

export class HealthService {
  constructor(private readonly repo: HealthRepository = healthRepository) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      await this.repo.pingDatabase();
      return {
        status: 'ok',
        db: 'connected',
        timestamp,
      };
    } catch {
      return {
        status: 'error',
        db: 'disconnected',
        timestamp,
      };
    }
  }
}

export const healthService = new HealthService();
