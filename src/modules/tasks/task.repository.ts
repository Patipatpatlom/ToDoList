import { Task, TaskPriority, TaskStatus, Workspace } from '@prisma/client';
import { prisma } from '@/shared/db.js';

export interface CreateTaskData {
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
}

export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface UpdateStatusWithLogParams {
  taskId: string;
  workspaceId: string;
  userId: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
}

export class TaskRepository {
  async findWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return !!member;
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    return prisma.task.create({
      data: {
        workspaceId: data.workspaceId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findTasks(
    workspaceId: string,
    filters: TaskFilterOptions,
    skip: number,
    take: number
  ): Promise<{ tasks: Task[]; total: number }> {
    const where = {
      workspaceId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async findTaskById(taskId: string, workspaceId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatusWithLog(params: UpdateStatusWithLogParams): Promise<Task> {
    return prisma.$transaction(async (tx) => {
      // 1. Update Task status
      const updatedTask = await tx.task.update({
        where: {
          id: params.taskId,
          workspaceId: params.workspaceId,
        },
        data: {
          status: params.newStatus,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 2. Append new audit row in TaskActivityLog
      await tx.taskActivityLog.create({
        data: {
          taskId: params.taskId,
          userId: params.userId,
          action: 'STATUS_UPDATED',
          oldValue: params.oldStatus,
          newValue: params.newStatus,
        },
      });

      return updatedTask;
    });
  }

  async deleteTask(taskId: string, workspaceId: string): Promise<void> {
    await prisma.task.delete({
      where: {
        id: taskId,
        workspaceId,
      },
    });
  }
}

export const taskRepository = new TaskRepository();
