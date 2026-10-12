import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '@/modules/tasks/task.service.js';
import { TaskRepository } from '@/modules/tasks/task.repository.js';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/shared/errors/index.js';

describe('TaskService Unit Tests (Mocked Repository & Database Layer 100%)', () => {
  let taskService: TaskService;
  let mockRepo: TaskRepository;

  const mockWorkspace = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Workspace',
    slug: 'test-workspace',
    ownerId: 'user-alice',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  describe('a. สร้าง Task สำเร็จเมื่อผู้ใช้เป็นสมาชิกของ Workspace', () => {
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

    it('should throw BadRequestError when assignee is not a workspace member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
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

  describe('b. โยน ForbiddenError ทันทีเมื่อผู้ใช้ไม่ได้เป็นสมาชิกใน Workspace', () => {
    it('createTask: should throw ForbiddenError when user is not a member', async () => {
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

    it('getTasks: should throw ForbiddenError when user is not a member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(false);

      await expect(
        taskService.getTasks(mockWorkspace.id, mockUserStranger, { page: 1, limit: 10 })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.findTasks).not.toHaveBeenCalled();
    });

    it('updateTaskStatus: should throw ForbiddenError when user is not a member', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(false);

      await expect(
        taskService.updateTaskStatus(
          mockWorkspace.id,
          'task-999',
          mockUserStranger,
          TaskStatus.DONE
        )
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.updateStatusWithLog).not.toHaveBeenCalled();
    });
  });

  describe('c. โยน NotFoundError เมื่อพยายามอัปเดตสถานะของ Task ที่ไม่มีอยู่จริง', () => {
    it('should throw NotFoundError when task does not exist in the workspace', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);
      vi.mocked(mockRepo.findTaskById).mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus(
          mockWorkspace.id,
          'non-existent-task-id',
          mockUserAlice,
          TaskStatus.DONE
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockRepo.findTaskById).toHaveBeenCalledWith('non-existent-task-id', mockWorkspace.id);
      expect(mockRepo.updateStatusWithLog).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when workspace does not exist', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus(
          'non-existent-workspace-id',
          'task-123',
          mockUserAlice,
          TaskStatus.DONE
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockRepo.updateStatusWithLog).not.toHaveBeenCalled();
    });
  });

  describe('d. ตรวจสอบว่าฟังก์ชันอัปเดตสถานะเรียก Transaction method ด้วยค่า parameters ที่ถูกต้อง', () => {
    const mockExistingTask = {
      id: 'task-target-456',
      workspaceId: mockWorkspace.id,
      title: 'Target Task For Transaction Test',
      description: 'Testing parameters passed to updateStatusWithLog',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should call updateStatusWithLog with exact required transaction parameters', async () => {
      vi.mocked(mockRepo.findWorkspaceById).mockResolvedValue(mockWorkspace);
      vi.mocked(mockRepo.isWorkspaceMember).mockResolvedValue(true);
      vi.mocked(mockRepo.findTaskById).mockResolvedValue(mockExistingTask);

      const updatedTaskResult = {
        ...mockExistingTask,
        status: TaskStatus.IN_PROGRESS,
      };

      vi.mocked(mockRepo.updateStatusWithLog).mockResolvedValue(updatedTaskResult);

      const result = await taskService.updateTaskStatus(
        mockWorkspace.id,
        mockExistingTask.id,
        mockUserAlice,
        TaskStatus.IN_PROGRESS
      );

      expect(mockRepo.findWorkspaceById).toHaveBeenCalledWith(mockWorkspace.id);
      expect(mockRepo.isWorkspaceMember).toHaveBeenCalledWith(mockWorkspace.id, mockUserAlice);
      expect(mockRepo.findTaskById).toHaveBeenCalledWith(mockExistingTask.id, mockWorkspace.id);

      // Verify exact parameter object passed to transaction repository method
      expect(mockRepo.updateStatusWithLog).toHaveBeenCalledTimes(1);
      expect(mockRepo.updateStatusWithLog).toHaveBeenCalledWith({
        taskId: mockExistingTask.id,
        workspaceId: mockWorkspace.id,
        userId: mockUserAlice,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });
});
