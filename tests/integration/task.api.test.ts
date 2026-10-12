import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/shared/db.js';
import { TaskPriority, TaskStatus, WorkspaceRole } from '@prisma/client';

describe('Task API Integration Tests (Supertest)', () => {
  let memberUser: { id: string; email: string };
  let nonMemberUser: { id: string; email: string };
  let testWorkspace: { id: string; slug: string };
  let testTask: { id: string; title: string; status: TaskStatus };

  beforeAll(async () => {
    // 1. Create test users
    memberUser = await prisma.user.create({
      data: {
        email: `test-member-${Date.now()}@example.com`,
        name: 'Test Member',
        passwordHash: 'dummy_hash',
      },
    });

    nonMemberUser = await prisma.user.create({
      data: {
        email: `test-nonmember-${Date.now()}@example.com`,
        name: 'Test Non-Member',
        passwordHash: 'dummy_hash',
      },
    });

    // 2. Create test workspace
    testWorkspace = await prisma.workspace.create({
      data: {
        name: 'Integration Test Workspace',
        slug: `integration-test-ws-${Date.now()}`,
        ownerId: memberUser.id,
      },
    });

    // 3. Add memberUser as workspace member
    await prisma.workspaceMember.create({
      data: {
        workspaceId: testWorkspace.id,
        userId: memberUser.id,
        role: WorkspaceRole.OWNER,
      },
    });

    // 4. Create an initial task
    testTask = await prisma.task.create({
      data: {
        workspaceId: testWorkspace.id,
        title: 'Initial Integration Task',
        description: 'Testing task workflows',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeId: memberUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testWorkspace?.id) {
      await prisma.taskActivityLog.deleteMany({
        where: { task: { workspaceId: testWorkspace.id } },
      });
      await prisma.task.deleteMany({ where: { workspaceId: testWorkspace.id } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId: testWorkspace.id } });
      await prisma.workspace.delete({ where: { id: testWorkspace.id } });
    }

    if (memberUser?.id) {
      await prisma.user.delete({ where: { id: memberUser.id } });
    }

    if (nonMemberUser?.id) {
      await prisma.user.delete({ where: { id: nonMemberUser.id } });
    }

    await prisma.$disconnect();
  });

  describe('POST /api/v1/workspaces/:workspaceId/tasks', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .send({ title: 'No auth task' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden when caller is not a workspace member', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', nonMemberUser.id)
        .send({ title: 'Intruder task' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 Validation Error when body fails Zod validation (e.g. empty title)', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', memberUser.id)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    it('should successfully create a task when caller is a workspace member', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', memberUser.id)
        .send({
          title: 'Implement E2E test suite',
          description: 'Writing Supertest integration cases',
          priority: TaskPriority.HIGH,
          assigneeId: memberUser.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Implement E2E test suite');
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.workspaceId).toBe(testWorkspace.id);

      // Verify in Database
      const savedTask = await prisma.task.findUnique({
        where: { id: res.body.data.id },
      });
      expect(savedTask).not.toBeNull();
      expect(savedTask?.title).toBe('Implement E2E test suite');
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/tasks', () => {
    it('should return 403 Forbidden when caller is not a workspace member', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', nonMemberUser.id);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return tasks with pagination metadata for workspace member', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks?page=1&limit=10`)
        .set('x-user-id', memberUser.id);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should correctly filter tasks by status', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks?status=TODO`)
        .set('x-user-id', memberUser.id);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.status).toBe('TODO');
      }
    });
  });

  describe('PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/status (Database Transaction)', () => {
    it('should return 400 Validation Error on invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', memberUser.id)
        .send({ status: 'INVALID_ENUM_VALUE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 Forbidden when caller is not a workspace member', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', nonMemberUser.id)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should atomically update task status AND create activity log row via $transaction', async () => {
      const initialStatus = testTask.status; // TODO
      const targetStatus = TaskStatus.DONE;

      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', memberUser.id)
        .send({ status: targetStatus });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(targetStatus);

      // Verify Database Transaction Effects:
      // 1. Task record must be updated in tasks table
      const dbTask = await prisma.task.findUnique({
        where: { id: testTask.id },
      });
      expect(dbTask).not.toBeNull();
      expect(dbTask?.status).toBe(targetStatus);

      // 2. Activity log record must be inserted in task_activity_logs table
      const activityLog = await prisma.taskActivityLog.findFirst({
        where: {
          taskId: testTask.id,
          userId: memberUser.id,
          action: 'STATUS_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(activityLog).not.toBeNull();
      expect(activityLog?.oldValue).toBe(initialStatus);
      expect(activityLog?.newValue).toBe(targetStatus);
      expect(activityLog?.userId).toBe(memberUser.id);
    });
  });
});
