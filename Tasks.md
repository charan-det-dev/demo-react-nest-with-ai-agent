# Tasks

Implementation plan for the registration website described in [CONTEXT.md](./CONTEXT.md), [ADR-0001](./docs/adr/0001-jwt-bearer-token-auth.md) and [ADR-0002](./docs/adr/0002-prisma-orm.md).

Stack: React + TypeScript + Tailwind (frontend) · NestJS + Prisma + PostgreSQL (backend) · JWT Bearer token auth · npm workspaces monorepo (`/frontend`, `/backend`) · Docker Compose (frontend + backend + Postgres + MailHog) for local dev.

## Setup

- [x] Root `package.json` with npm workspaces (`frontend`, `backend`)
- [x] `.env.example` (DB connection string, JWT secret, SMTP host/port for MailHog, token expiry settings)
- [x] `docker-compose.yml`: `postgres`, `mailhog`, `backend`, `frontend` services
- [x] `.gitignore` (node_modules, dist, .env, Prisma generated client)
- [x] Root `README.md` with setup/run instructions

## Backend (NestJS)

**Project scaffolding**
- [x] `nest new backend` scaffold, wired into the workspace
- [x] `@nestjs/config` for env vars
- [x] `Dockerfile` for backend service

**Data model (Prisma + PostgreSQL)**
- [x] `User` model: `id`, `email` (unique), `passwordHash`, `phone` (nullable), `verified` (bool, default false), `failedLoginAttempts`, `lockedUntil` (nullable), `createdAt`, `updatedAt`
- [x] `VerificationToken` and `PasswordResetToken` (or fields on `User`): token, `expiresAt`
- [x] Initial Prisma migration
- [x] `PrismaService`/`PrismaModule`

**Auth module**
- [x] `POST /auth/register` — validate email/password/phone(optional), hash password (bcrypt), create unverified `User`, generate verification token, send verification email
- [x] `GET /auth/verify-email?token=...` — validate token + expiry, mark `User.verified = true`
- [x] `POST /auth/login` — reject unverified users; check `Lockout` state; verify password; on repeated failures increment `failedLoginAttempts` and set `lockedUntil` past threshold; issue JWT (Bearer, per ADR-0001) on success
- [x] `POST /auth/forgot-password` — generate reset token, email reset link (always respond generically to avoid email enumeration)
- [x] `POST /auth/reset-password` — validate reset token + expiry, update `passwordHash`, invalidate token
- [x] `JwtStrategy` + `JwtAuthGuard` for protected routes
- [x] Rate limiting via `@nestjs/throttler` on `/auth/login`, `/auth/register`, `/auth/forgot-password`
- [x] DTOs + `class-validator` rules for all auth endpoints

**Mail**
- [x] `MailService` (nodemailer) pointed at MailHog SMTP in dev
- [x] Verification email template (link with token)
- [x] Password reset email template (link with token)

**Cross-cutting**
- [x] CORS configured for frontend origin
- [x] Global validation pipe + exception filter (consistent error shape)

## Frontend (React + TypeScript + Tailwind)

**Project scaffolding**
- [x] Vite + React + TypeScript project
- [x] Tailwind CSS setup
- [x] `Dockerfile` for frontend service
- [x] API client wrapper that attaches JWT from `localStorage` as `Authorization: Bearer <token>` (per ADR-0001)

**Auth state**
- [x] `AuthContext`/hook: holds token + current user, persists token to `localStorage`, exposes login/logout
- [x] `ProtectedRoute` wrapper redirecting unauthenticated users to `/login`

**Pages**
- [x] `Register` — email, password, phone (optional); calls `POST /auth/register`; shows "check your email" state
- [x] `VerifyEmail` — reads token from URL, calls `GET /auth/verify-email`, shows result
- [x] `Login` — email/password; surfaces "not verified" and "locked out" error states distinctly
- [x] `ForgotPassword` — email input, calls `POST /auth/forgot-password`
- [x] `ResetPassword` — reads token from URL, new password form, calls `POST /auth/reset-password`
- [x] `Home` (protected) — simple landing page after login

**Routing**
- [x] Router wiring all pages above, protected route for `Home`

## QA

**Automated tests (backend unit tests, per grilling decision)**
- [x] `AuthService.register` — creates unverified user, hashes password, does not store phone... (covers phone optional both provided/omitted)
- [x] `AuthService.verifyEmail` — valid token verifies user; expired/invalid token rejected
- [x] `AuthService.login` — rejects unverified user; rejects wrong password; issues JWT on success
- [x] `AuthService.login` lockout — N failed attempts locks the account; locked account rejected even with correct password until `lockedUntil` passes
- [x] `AuthService.forgotPassword` / `resetPassword` — valid token resets password; expired/invalid token rejected; old password stops working after reset

**Manual / end-to-end verification**
- [x] Full flow: register → receive email in MailHog → verify → login → access protected `Home`
- [x] Attempt login before verifying email → rejected with correct message
- [x] Trigger lockout by repeated bad logins → confirm locked message, confirm unlock after cooldown
- [x] Forgot password → reset via MailHog link → old password no longer works, new one does
- [x] `docker-compose up` brings up frontend, backend, Postgres, MailHog together cleanly from a clean checkout
- [x] CORS: frontend (separate origin) can call backend API without errors
- [x] Responsive check of all pages (mobile width) since Tailwind is in use
