import { app } from './app.js';
import { config } from './config.js';
import { logger } from '@/shared/utils/logger.js';
import { prisma } from '@/shared/db.js';

export const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`Server successfully started`, {
      port: config.port,
      environment: config.nodeEnv,
      healthEndpoint: `http://localhost:${config.port}/api/v1/health`,
    });
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await prisma.$disconnect();
        logger.info('Database connections closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection', { error: err });
        process.exit(1);
      }
    });

    // Force close if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};

// Start server automatically
export const server = startServer();
