# Registration Website

A website where people create a personal account (**Registration**) to access the application, verify their
email (**Verification**), log in, and recover a forgotten password. See [CONTEXT.md](./CONTEXT.md) for the
domain glossary and [Tasks.md](./Tasks.md) for the implementation checklist.

Stack: React + TypeScript + Tailwind (frontend) · NestJS + Prisma + PostgreSQL (backend) · JWT Bearer token
auth ([ADR-0001](./docs/adr/0001-jwt-bearer-token-auth.md)) · Prisma ORM
([ADR-0002](./docs/adr/0002-prisma-orm.md)) · npm workspaces monorepo (`/frontend`, `/backend`) · Docker
Compose (frontend + backend + Postgres + MailHog) for local dev.

## Prerequisites

- Node.js >= 20 and npm
- Docker + Docker Compose (for Postgres/MailHog, or to run everything containerized)

## Setup

1. Copy the environment template and adjust values if needed:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies (npm workspaces installs both `frontend` and `backend`):

   ```bash
   npm install
   ```

## Running with Docker Compose (recommended)

Brings up Postgres, MailHog, the backend API, and the frontend together:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MailHog web UI (view sent emails): http://localhost:8025
- Postgres: localhost:5432 (`postgres`/`postgres`, db `app`)

## Running locally without Docker

Start Postgres and MailHog only:

```bash
docker compose up postgres mailhog
```

Then, in separate terminals, run the backend and frontend from the repo root:

```bash
npm run dev:backend
npm run dev:frontend
```

Apply Prisma migrations against your local database (run from `/backend`, or via the workspace flag):

```bash
npm run prisma:migrate --workspace=backend
```

## Useful scripts (from repo root)

| Command | Description |
| --- | --- |
| `npm run dev:backend` | Start the NestJS backend in watch mode |
| `npm run dev:frontend` | Start the Vite frontend dev server |
| `npm run build:backend` | Build the backend for production |
| `npm run build:frontend` | Build the frontend for production |
| `npm run test:backend` | Run backend unit tests |

## Project structure

```
/backend    NestJS + Prisma API (auth: register/verify-email/login/forgot-password/reset-password)
/frontend   React + TypeScript + Tailwind SPA
/docs/adr   Architecture decision records
```
