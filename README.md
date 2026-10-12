# Task Management Backend

Production-ready Task Management Backend starter built with **Node.js**, **TypeScript**, and **PostgreSQL 16**.

## Tech Stack & Tooling

- **Runtime:** Node.js (ESM)
- **Language:** TypeScript (`strict: true`, path alias `@/*` -> `src/*`)
- **Dev Runner:** `tsx` (TypeScript Execute with watch mode)
- **Database:** PostgreSQL 16 Alpine via Docker Compose
- **Code Quality:** ESLint (Flat Config) & Prettier
- **Environment:** `dotenv`

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Environment Variables

Copy the example environment file and adjust if necessary:

```bash
cp .env.example .env
```

### 3. Start Database (PostgreSQL 16)

Start the PostgreSQL service in the background:

```bash
docker compose up -d
```

Verify that the container is healthy:

```bash
docker compose ps
```

To stop the database:

```bash
docker compose down
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Available Scripts

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Start development server with hot-reload via `tsx watch` |
| `npm run build`        | Compile TypeScript into `dist/`                          |
| `npm run start`        | Run compiled production build                            |
| `npm run lint`         | Run ESLint check                                         |
| `npm run lint:fix`     | Run ESLint with auto-fix                                 |
| `npm run format`       | Format codebase with Prettier                            |
| `npm run format:check` | Check code formatting without modifying files            |

---

## Project Structure

```text
.
├── .env.example          # Environment variable template
├── .env                  # Local environment file (git-ignored)
├── .gitignore            # Git ignore definitions
├── .prettierignore       # Prettier ignore list
├── .prettierrc           # Prettier configuration
├── docker-compose.yml    # PostgreSQL 16 service definition
├── eslint.config.mjs     # ESLint Flat Config
├── package.json          # Project metadata, scripts, dependencies
├── tsconfig.json         # TypeScript configuration (strict, path aliases)
└── src/
    ├── config.ts         # Environment configuration loader
    └── index.ts          # Application entrypoint
```
