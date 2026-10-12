import express, { Application } from 'express';
import cors from 'cors';
import { apiRouter } from '@/routes/index.js';
import { errorHandler, notFoundHandler } from '@/shared/middlewares/error.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/v1', apiRouter);

  // Catch-all 404 handler
  app.use(notFoundHandler);

  // Global Error Handler Middleware
  app.use(errorHandler);

  return app;
};

export const app = createApp();
