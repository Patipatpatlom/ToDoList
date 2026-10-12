import { Request, Response, NextFunction } from 'express';
import { HealthService, healthService } from '@/services/health.service.js';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.checkHealth();
      const statusCode = result.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: result.status === 'healthy',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
