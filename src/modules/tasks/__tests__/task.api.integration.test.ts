import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/shared/db.js';
import { TaskPriority, TaskStatus, WorkspaceRole } from '@prisma/client';

describe('Task API Integration Tests (Supertest & PostgreSQL Test Database)', () => {
  let memberUser: { id: string; email: string };
  let nonMemberUser: { id: string; email: string };
  let testWorkspace: { id: string; slug: string };
  let testTask: { id: string; title: string; status: TaskStatus };

  const createdUserIds: string[] = [];
  const createdWorkspaceIds: string[] = [];

  beforeAll(async () => {
    // 1. Setup: Create isolated test users
    memberUser = await prisma.user.create({
      data: {
        email: `member-test-${Date.now()}@example.com`,
        name: 'Member User',
        passwordHash: 'dummy_hash',
      },
    });
    createdUserIds.push(memberUser.id);

    nonMemberUser = await prisma.user.create({
      data: {
        email: `nonmember-test-${Date.now()}@example.com`,
        name: 'Non-Member User',
        passwordHash: 'dummy_hash',
      },
    });
    createdUserIds.push(nonMemberUser.id);

    // 2. Setup: Create test workspace
    testWorkspace = await prisma.workspace.create({
      data: {
        name: 'Automated Test Workspace',
        slug: `auto-test-ws-${Date.now()}`,
        ownerId: memberUser.id,
      },
    });
    createdWorkspaceIds.push(testWorkspace.id);

    // 3. Setup: Register memberUser as workspace member
    await prisma.workspaceMember.create({
      data: {
        workspaceId: testWorkspace.id,
        userId: memberUser.id,
        role: WorkspaceRole.OWNER,
      },
    });

    // 4. Setup: Create initial test task
    testTask = await prisma.task.create({
      data: {
        workspaceId: testWorkspace.id,
        title: 'Initial Seed Task for Testing',
        description: 'Pre-existing task for status transition tests',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeId: memberUser.id,
      },
    });
  });

  afterAll(async () => {
    // Teardown: Clean up test-created data specifically
    if (createdWorkspaceIds.length > 0) {
      await prisma.taskActivityLog.deleteMany({
        where: { task: { workspaceId: { in: createdWorkspaceIds } } },
      });
      await prisma.task.deleteMany({
        where: { workspaceId: { in: createdWorkspaceIds } },
      });
      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: { in: createdWorkspaceIds } },
      });
      await prisma.workspace.deleteMany({
        where: { id: { in: createdWorkspaceIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  describe('a. POST /api/v1/workspaces/:workspaceId/tasks', () => {
    it('should create and persist task to database successfully with status 201', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', memberUser.id)
        .send({
          title: 'Implement Multi-Stage Dockerfile',
          description: 'Production runner with minimal Alpine footprint',
          priority: TaskPriority.HIGH,
          assigneeId: memberUser.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Implement Multi-Stage Dockerfile');
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.workspaceId).toBe(testWorkspace.id);

      // Verify direct database persistence
      const persistedTask = await prisma.task.findUnique({
        where: { id: res.body.data.id },
      });
      expect(persistedTask).not.toBeNull();
      expect(persistedTask?.title).toBe('Implement Multi-Stage Dockerfile');
      expect(persistedTask?.priority).toBe(TaskPriority.HIGH);
      expect(persistedTask?.status).toBe(TaskStatus.TODO);
    });

    it('should return 400 Validation Error when body fails Zod validation', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', memberUser.id)
        .send({ title: '' }); // empty title violates min(1)

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('b. GET /api/v1/workspaces/:workspaceId/tasks', () => {
    it('should return tasks with pagination metadata (total, page, totalPages, data)', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks?page=1&limit=10`)
        .set('x-user-id', memberUser.id);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify pagination metadata structure
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should correctly filter tasks by status and priority', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks?status=TODO&priority=HIGH`)
        .set('x-user-id', memberUser.id);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.status).toBe('TODO');
        expect(t.priority).toBe('HIGH');
      }
    });
  });

  describe('c. PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/status (Database Transaction)', () => {
    it('should atomically update task status TODO -> IN_PROGRESS AND insert audit row into TaskActivityLog', async () => {
      const initialStatus = testTask.status; // TODO
      const targetStatus = TaskStatus.IN_PROGRESS;

      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', memberUser.id)
        .send({ status: targetStatus });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(targetStatus);

      // 1. Query database: verify status in Task table is updated
      const updatedTaskFromDb = await prisma.task.findUnique({
        where: { id: testTask.id },
      });
      expect(updatedTaskFromDb).not.toBeNull();
      expect(updatedTaskFromDb?.status).toBe(targetStatus);

      // 2. Query database: verify new row created in TaskActivityLog table
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
      expect(activityLog?.taskId).toBe(testTask.id);
    });

    it('should return 400 Validation Error on invalid status enum value', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', memberUser.id)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('d. Forbidden Access (Member Guard)', () => {
    it('POST: should return 403 Forbidden when caller is not in workspace', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', nonMemberUser.id)
        .send({ title: 'Intruder Task' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET: should return 403 Forbidden when caller is not in workspace', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspace.id}/tasks`)
        .set('x-user-id', nonMemberUser.id);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PATCH: should return 403 Forbidden when caller is not in workspace', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${testWorkspace.id}/tasks/${testTask.id}/status`)
        .set('x-user-id', nonMemberUser.id)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
