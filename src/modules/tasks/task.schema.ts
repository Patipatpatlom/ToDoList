import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const workspaceParamSchema = z.object({
  workspaceId: z.string().uuid({ message: 'Invalid workspaceId format (must be UUID)' }),
});

export const taskParamsSchema = z.object({
  workspaceId: z.string().uuid({ message: 'Invalid workspaceId format (must be UUID)' }),
  taskId: z.string().uuid({ message: 'Invalid taskId format (must be UUID)' }),
});

export const createTaskBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional(),
  status: z
    .nativeEnum(TaskStatus, {
      message: 'Status must be TODO, IN_PROGRESS, or DONE',
    })
    .optional()
    .default(TaskStatus.TODO),
  priority: z
    .nativeEnum(TaskPriority, {
      message: 'Priority must be LOW, MEDIUM, or HIGH',
    })
    .optional()
    .default(TaskPriority.MEDIUM),
  assigneeId: z.string().uuid({ message: 'Invalid assigneeId format (must be UUID)' }).optional(),
});

export const getTasksQuerySchema = z.object({
  status: z
    .nativeEnum(TaskStatus, {
      message: 'Status filter must be TODO, IN_PROGRESS, or DONE',
    })
    .optional(),
  priority: z
    .nativeEnum(TaskPriority, {
      message: 'Priority filter must be LOW, MEDIUM, or HIGH',
    })
    .optional(),
  assigneeId: z.string().uuid({ message: 'Invalid assigneeId filter format' }).optional(),
  page: z.coerce.number().int().min(1, 'Page must be greater than 0').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'Limit cannot exceed 100').default(10),
});

export const updateTaskStatusBodySchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    message: 'Status must be TODO, IN_PROGRESS, or DONE',
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskBodySchema>;
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusBodySchema>;
