import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '@/modules/tasks/task.service.js';
import { TaskRepository } from '@/modules/tasks/task.repository.js';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/shared/errors/index.js';

describe('TaskService (Unit Tests)', () => {
  let taskService: TaskService;
  let mockRepo: TaskRepository;

  const mockWorkspace = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Workspace',
    slug: 'test-workspace',
    ownerId: 'user-alice',
    createdAt: new Date(),
  };

  const mockUserAlice = 'user-alice';
  const mockUserBob = 'user-bob';
  const mockUserStranger = 'user-stranger';

  beforeEach(() => {
    mockRepo = {
      findWorkspaceById: vi.fn(),
      isWorkspaceMember: vi.fn(),
      createTask: vi.fn(),
      findTasks: vi.fn(),
      findTaskById: vi.fn(),
      updateStatusWithLog: vi.fn(),
    } as unknown as TaskRepository;

    taskService = new TaskService(mockRepo);
  });

  describe('createTask', () => {
    it('should successfully create a task when caller is a workspace member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);

      const createdTaskMock = {
        id: 'task-123',
        workspaceId: mockWorkspace.id,
        title: 'Complete unit tests',
        description: 'Ensure 100% test coverage',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        assigneeId: mockUserBob,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.createTask).mockResolvedValue(createdTaskMock);

      const result = await taskService.createTask(mockWorkspace.id, mockUserAlice, {
        title: 'Complete unit tests',
        description: 'Ensure 100% test coverage',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        assigneeId: mockUserBob,
      });

      expect(mockRepo.findWorkspaceById).toHaveBeenCalledWith(mockWorkspace.id);
      expect(mockRepo.isWorkspaceMember).toHaveBeenCalledWith(mockWorkspace.id, mockUserAlice);
      expect(mockRepo.isWorkspaceMember).toHaveBeenCalledWith(mockWorkspace.id, mockUserBob);
      expect(mockRepo.createTask).toHaveBeenCalledWith({
        workspaceId: mockWorkspace.id,
        title: 'Complete unit tests',
        description: 'Ensure 100% test coverage',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        assigneeId: mockUserBob,
      });
      expect(result).toEqual(createdTaskMock);
    });

    it('should throw NotFoundError if workspace does not exist', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(null);

      await expect(
        taskService.createTask('non-existent-workspace', mockUserAlice, {
          title: 'Orphan task',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      ).rejects.toThrow(NotFoundError);

      expect(mockRepo.createTask).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user is not a member of the workspace', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(false);

      await expect(
        taskService.createTask(mockWorkspace.id, mockUserStranger, {
          title: 'Intruder task',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.createTask).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when assigneeId is not a workspace member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      // Alice is member, but stranger assignee is not
      vi.mocked(mockRepo.isWorkspaceMember).mockImplementation(
        async (_workspaceId, userId) => userId === mockUserAlice
      );

      await expect(
        taskService.createTask(mockWorkspace.id, mockUserAlice, {
          title: 'Invalid assignee task',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assigneeId: mockUserStranger,
        })
      ).rejects.toThrow(BadRequestError);

      expect(mockRepo.createTask).not.toHaveBeenCalled();
    });
  });

  describe('getTasks', () => {
    it('should return paginated tasks when user is a workspace member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);

      const sampleTasks = [
        {
          id: 'task-1',
          workspaceId: mockWorkspace.id,
          title: 'Task 1',
          description: null,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assigneeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockRepo.findTasks).mockResolvedValue({
        tasks: sampleTasks,
        total: 1,
      });

      const result = await taskService.getTasks(mockWorkspace.id, mockUserAlice, {
        page: 1,
        limit: 10,
      });

      expect(result.tasks).toEqual(sampleTasks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should throw ForbiddenError when user is not a member of the workspace', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(false);

      await expect(
        taskService.getTasks(mockWorkspace.id, mockUserStranger, { page: 1, limit: 10 })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.findTasks).not.toHaveBeenCalled();
    });
  });

  describe('updateTaskStatus', () => {
    const mockExistingTask = {
      id: 'task-target',
      workspaceId: mockWorkspace.id,
      title: 'Target Task',
      description: null,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update task status and log activity when user is a member and task exists', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);
      vi.mocked(mockRepo.findTaskById).mockResolvedValue(mockExistingTask);

      const updatedTask = {
        ...mockExistingTask,
        status: TaskStatus.DONE,
      };

      vi.mocked(mockRepo.updateStatusWithLog).mockResolvedValue(updatedTask);

      const result = await taskService.updateTaskStatus(
        mockWorkspace.id,
        mockExistingTask.id,
        mockUserAlice,
        TaskStatus.DONE
      );

      expect(mockRepo.findTaskById).toHaveBeenCalledWith(mockExistingTask.id, mockWorkspace.id);
      expect(mockRepo.updateStatusWithLog).toHaveBeenCalledWith({
        taskId: mockExistingTask.id,
        workspaceId: mockWorkspace.id,
        userId: mockUserAlice,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.DONE,
      });
      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('should throw ForbiddenError when user is not a member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(false);

      await expect(
        taskService.updateTaskStatus(
          mockWorkspace.id,
          mockExistingTask.id,
          mockUserStranger,
          TaskStatus.DONE
        )
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.updateStatusWithLog).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when task does not exist in the workspace', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);
      vi.mocked(mockRepo.findTaskById).mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus(
          mockWorkspace.id,
          'non-existent-task',
          mockUserAlice,
          TaskStatus.DONE
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockRepo.updateStatusWithLog).not.toHaveBeenCalled();
    });
  });
});
