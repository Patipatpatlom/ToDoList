# Task Management Backend

Production-ready Task Management Backend built with **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL 16**.

## Architecture & Design

The application follows a clean **Layered Architecture**:

```text
HTTP Request
     │
     ▼
[Controller]       → Handles request validation & HTTP response formatting
     │
     ▼
 [Service]         → Contains business logic & orchestration
     │
     ▼
[Repository]       → Direct data access & database queries via Prisma ORM
     │
     ▼
[Database]         → PostgreSQL 16
```

---

## Tech Stack & Tooling

- **Runtime & Web Framework:** Node.js (ESM), Express 4
- **Language:** TypeScript (`strict: true`, path alias `@/*` -> `src/*`)
- **ORM & Database:** Prisma ORM, PostgreSQL 16 Alpine via Docker Compose
- **Validation:** Zod schemas via validation middleware
- **Dev Runner:** `tsx` (TypeScript Execute with watch mode)
- **Code Quality:** ESLint (Flat Config) & Prettier
- **Environment:** `dotenv`

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### 3. Start Database (PostgreSQL 16)

Start PostgreSQL via Docker Compose:

```bash
docker compose up -d
```

Verify that the container is healthy:

```bash
docker compose ps
```

### 4. Run Migrations & Seed Database

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Test the health check endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

---

## Available Scripts

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Start development server with hot-reload via `tsx watch` |
| `npm run build`        | Compile TypeScript into `dist/`                          |
| `npm run start`        | Run compiled production build                            |
| `npm run db:migrate`   | Run Prisma database migrations                           |
| `npm run db:seed`      | Seed database with mock data                             |
| `npm run db:studio`    | Launch Prisma Studio GUI                                 |
| `npm run lint`         | Run ESLint check                                         |
| `npm run lint:fix`     | Run ESLint with auto-fix                                 |
| `npm run format`       | Format codebase with Prettier                            |
| `npm run format:check` | Check code formatting without modifying files            |

---

## Standardized Error Handling

All errors are intercepted by the Global Error Middleware and return a uniform JSON format:

```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

Validation errors via Zod return additional error details:

```json
{
  "success": false,
  "error": {
    "message": "Request validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "rule": "invalid_string"
      }
    ]
  }
}
```

---

## Project Structure

```text
.
├── docker-compose.yml             # PostgreSQL 16 service definition
├── eslint.config.mjs              # ESLint Flat Config
├── package.json                   # Project metadata, scripts, dependencies
├── tsconfig.json                  # TypeScript configuration (strict, path aliases)
├── prisma/
│   ├── schema.prisma              # Data models and relations
│   ├── seed.ts                    # Idempotent seed script
│   └── migrations/                # Database migrations
└── src/
    ├── app.ts                     # Express app configuration & middlewares
    ├── config.ts                  # Environment variables loader
    ├── index.ts                   # Server entrypoint & graceful shutdown
    ├── controllers/               # Controller Layer
    │   └── health.controller.ts
    ├── services/                  # Service Layer
    │   └── health.service.ts
    ├── repositories/              # Repository Layer
    │   └── health.repository.ts
    ├── routes/                    # API Route Definitions
    │   ├── index.ts
    │   └── health.routes.ts
    └── shared/                    # Shared Utilities & Infrastructure
        ├── db.ts                  # Prisma Client Singleton
        ├── errors/                # Custom App Errors hierarchy
        │   ├── app-error.ts
        │   └── index.ts
        ├── middlewares/           # Global Middlewares
        │   ├── error.middleware.ts
        │   └── validate.middleware.ts
        └── utils/
            └── logger.ts          # Structured JSON logger
```
