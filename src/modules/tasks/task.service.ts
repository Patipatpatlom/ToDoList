import { Task, TaskStatus } from '@prisma/client';
import { TaskRepository, taskRepository } from './task.repository.js';
import { CreateTaskInput, GetTasksQuery, UpdateTaskInput } from './task.schema.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/shared/errors/index.js';

export interface PaginatedTasksResult {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class TaskService {
  constructor(private readonly repo: TaskRepository = taskRepository) {}

  /**
   * Enforces that the workspace exists and the requesting user is an active member.
   * Throws NotFoundError if workspace does not exist.
   * Throws ForbiddenError if user is not a member.
   */
  private async ensureWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.repo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError(`Workspace with ID ${workspaceId} not found`);
    }

    const isMember = await this.repo.isWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this workspace');
    }
  }

  async createTask(workspaceId: string, userId: string, input: CreateTaskInput): Promise<Task> {
    await this.ensureWorkspaceMember(workspaceId, userId);

    if (input.assigneeId) {
      const isAssigneeMember = await this.repo.isWorkspaceMember(workspaceId, input.assigneeId);
      if (!isAssigneeMember) {
        throw new BadRequestError('Assignee must be a member of this workspace');
      }
    }

    return this.repo.createTask({
      workspaceId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
    });
  }

  async getTasks(
    workspaceId: string,
    userId: string,
    query: GetTasksQuery
  ): Promise<PaginatedTasksResult> {
    await this.ensureWorkspaceMember(workspaceId, userId);

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 10));
    const { status, priority, assigneeId } = query || {};
    const skip = (page - 1) * limit;

    const { tasks, total } = await this.repo.findTasks(
      workspaceId,
      { status, priority, assigneeId },
      skip,
      limit
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateTaskStatus(
    workspaceId: string,
    taskId: string,
    userId: string,
    newStatus: TaskStatus
  ): Promise<Task> {
    await this.ensureWorkspaceMember(workspaceId, userId);

    const existingTask = await this.repo.findTaskById(taskId, workspaceId);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${taskId} not found in this workspace`);
    }

    // Atomic update with audit log in $transaction
    return this.repo.updateStatusWithLog({
      taskId,
      workspaceId,
      userId,
      oldStatus: existingTask.status,
      newStatus,
    });
  }

  async updateTask(
    workspaceId: string,
    taskId: string,
    userId: string,
    input: UpdateTaskInput
  ): Promise<Task> {
    await this.ensureWorkspaceMember(workspaceId, userId);

    const existingTask = await this.repo.findTaskById(taskId, workspaceId);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${taskId} not found in this workspace`);
    }

    if (input.assigneeId) {
      const isAssigneeMember = await this.repo.isWorkspaceMember(workspaceId, input.assigneeId);
      if (!isAssigneeMember) {
        throw new BadRequestError('Assignee must be a member of this workspace');
      }
    }

    return this.repo.updateTask(taskId, workspaceId, input);
  }

  async deleteTask(workspaceId: string, taskId: string, userId: string): Promise<void> {
    await this.ensureWorkspaceMember(workspaceId, userId);
    const existingTask = await this.repo.findTaskById(taskId, workspaceId);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${taskId} not found in this workspace`);
    }
    await this.repo.deleteTask(taskId, workspaceId);
  }
}

export const taskService = new TaskService();
