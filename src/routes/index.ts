import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { taskRouter } from '@/modules/tasks/task.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/', taskRouter);
