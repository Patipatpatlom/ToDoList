import { PrismaClient, WorkspaceRole, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data for idempotency
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create 2 Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // hashed 'Password123!'
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // hashed 'Password123!'
    },
  });

  console.log(`✓ Created 2 users: ${alice.name} (${alice.email}), ${bob.name} (${bob.email})`);

  // 2. Create 1 Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Product Engineering',
      slug: 'product-engineering',
      ownerId: alice.id,
    },
  });

  console.log(`✓ Created workspace: ${workspace.name} (slug: ${workspace.slug})`);

  // 3. Add 2 Workspace Members
  const ownerMember = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: alice.id,
      role: WorkspaceRole.OWNER,
    },
  });

  const normalMember = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: bob.id,
      role: WorkspaceRole.MEMBER,
    },
  });

  console.log(
    `✓ Created 2 workspace members: Alice (${ownerMember.role}), Bob (${normalMember.role})`
  );

  // 4. Create 3 Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions workflow for linting, testing, and Docker builds.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeId: alice.id,
      activityLogs: {
        create: [
          {
            userId: alice.id,
            action: 'STATUS_UPDATED',
            oldValue: 'IN_PROGRESS',
            newValue: 'DONE',
          },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: 'Implement authentication service',
      description: 'Build JWT-based authentication with refresh token rotation and bcrypt hashing.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: bob.id,
      activityLogs: {
        create: [
          {
            userId: bob.id,
            action: 'STATUS_UPDATED',
            oldValue: 'TODO',
            newValue: 'IN_PROGRESS',
          },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: 'Design RESTful API endpoints for tasks',
      description: 'Define task CRUD endpoints, request validation schemas, and error responses.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: bob.id,
    },
  });

  console.log(`✓ Created 3 sample tasks:`);
  console.log(
    `  - [${task1.status}] ${task1.title} (Assignee: Alice, Priority: ${task1.priority})`
  );
  console.log(`  - [${task2.status}] ${task2.title} (Assignee: Bob, Priority: ${task2.priority})`);
  console.log(`  - [${task3.status}] ${task3.title} (Assignee: Bob, Priority: ${task3.priority})`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
