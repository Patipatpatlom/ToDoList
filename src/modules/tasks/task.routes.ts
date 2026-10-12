import { Router } from 'express';
import { taskController } from './task.controller.js';
import {
  workspaceParamSchema,
  taskParamsSchema,
  createTaskBodySchema,
  getTasksQuerySchema,
  updateTaskStatusBodySchema,
} from './task.schema.js';
import { validate } from '@/shared/middlewares/validate.middleware.js';

export const taskRouter = Router();

// POST /api/v1/workspaces/:workspaceId/tasks
taskRouter.post(
  '/workspaces/:workspaceId/tasks',
  validate({
    params: workspaceParamSchema,
    body: createTaskBodySchema,
  }),
  taskController.createTask
);

// GET /api/v1/workspaces/:workspaceId/tasks
taskRouter.get(
  '/workspaces/:workspaceId/tasks',
  validate({
    params: workspaceParamSchema,
    query: getTasksQuerySchema,
  }),
  taskController.getTasks
);

// PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/status
taskRouter.patch(
  '/workspaces/:workspaceId/tasks/:taskId/status',
  validate({
    params: taskParamsSchema,
    body: updateTaskStatusBodySchema,
  }),
  taskController.updateTaskStatus
);

// DELETE /api/v1/workspaces/:workspaceId/tasks/:taskId
taskRouter.delete(
  '/workspaces/:workspaceId/tasks/:taskId',
  validate({
    params: taskParamsSchema,
  }),
  taskController.deleteTask
);
