import { Task, TaskPriority, TaskStatus, Workspace } from '@prisma/client';
import { prisma } from '@/shared/db.js';

export interface CreateTaskData {
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
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
  async getOrCreateAssigneeByName(workspaceId: string, name: string): Promise<string> {
    const trimmedName = name.trim();
    let user = await prisma.user.findFirst({
      where: { name: trimmedName },
    });

    if (!user) {
      const slug =
        trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now()}`;
      user = await prisma.user.create({
        data: {
          email: `${slug}-${Date.now()}@workspace.local`,
          name: trimmedName,
          passwordHash: 'seeded-hash',
        },
      });
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          role: 'MEMBER',
        },
      });
    } else {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id,
          },
        },
      });
      if (!member) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: user.id,
            role: 'MEMBER',
          },
        });
      }
    }
    return user.id;
  }

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
    let finalAssigneeId = data.assigneeId;
    if (data.assigneeName && data.assigneeName.trim()) {
      finalAssigneeId = await this.getOrCreateAssigneeByName(data.workspaceId, data.assigneeName);
    }

    return prisma.task.create({
      data: {
        workspaceId: data.workspaceId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: finalAssigneeId,
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

  async updateTask(
    taskId: string,
    workspaceId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      assigneeName?: string | null;
    }
  ): Promise<Task> {
    let finalAssigneeId = data.assigneeId;

    if (data.assigneeName !== undefined) {
      if (!data.assigneeName || !data.assigneeName.trim()) {
        finalAssigneeId = null;
      } else {
        finalAssigneeId = await this.getOrCreateAssigneeByName(workspaceId, data.assigneeName);
      }
    }

    return prisma.task.update({
      where: {
        id: taskId,
        workspaceId,
      },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(finalAssigneeId !== undefined ? { assigneeId: finalAssigneeId } : {}),
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
