import { Request, Response, NextFunction } from 'express';
import { TaskService, taskService } from './task.service.js';
import { CreateTaskInput, GetTasksQuery, UpdateTaskStatusInput } from './task.schema.js';
import { UnauthorizedError } from '@/shared/errors/index.js';

export class TaskController {
  constructor(private readonly service: TaskService = taskService) {}

  private getAuthenticatedUserId(req: Request): string {
    const userId =
      (req.headers['x-user-id'] as string) ||
      (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      throw new UnauthorizedError('Authentication required: please provide x-user-id header');
    }
    return userId;
  }

  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const workspaceId = req.params.workspaceId as string;
      const body = req.body as CreateTaskInput;

      const task = await this.service.createTask(workspaceId, userId, body);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const workspaceId = req.params.workspaceId as string;
      const query = (res.locals.query || req.query) as unknown as GetTasksQuery;

      const result = await this.service.getTasks(workspaceId, userId, query);

      res.status(200).json({
        success: true,
        data: result.tasks,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const workspaceId = req.params.workspaceId as string;
      const taskId = req.params.taskId as string;
      const { status } = req.body as UpdateTaskStatusInput;

      const task = await this.service.updateTaskStatus(workspaceId, taskId, userId, status);

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController();
