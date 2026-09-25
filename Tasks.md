# Tasks

Implementation plan for the registration website described in [CONTEXT.md](./CONTEXT.md), [ADR-0001](./docs/adr/0001-jwt-bearer-token-auth.md) and [ADR-0002](./docs/adr/0002-prisma-orm.md).

Stack: React + TypeScript + Tailwind (frontend) · NestJS + Prisma + PostgreSQL (backend) · JWT Bearer token auth · npm workspaces monorepo (`/frontend`, `/backend`) · Docker Compose (frontend + backend + Postgres + MailHog) for local dev.

## Setup

- [x] Root `package.json` with npm workspaces (`frontend`, `backend`)
- [x] `.env.example` (DB connection string, JWT secret, SMTP host/port for MailHog, token expiry settings)
- [ ] `docker-compose.yml`: `postgres`, `mailhog`, `backend`, `frontend` services
- [ ] `.gitignore` (node_modules, dist, .env, Prisma generated client)
- [ ] Root `README.md` with setup/run instructions

## Backend (NestJS)

**Project scaffolding**
- [ ] `nest new backend` scaffold, wired into the workspace
- [ ] `@nestjs/config` for env vars
- [ ] `Dockerfile` for backend service

**Data model (Prisma + PostgreSQL)**
- [ ] `User` model: `id`, `email` (unique), `passwordHash`, `phone` (nullable), `verified` (bool, default false), `failedLoginAttempts`, `lockedUntil` (nullable), `createdAt`, `updatedAt`
- [ ] `VerificationToken` and `PasswordResetToken` (or fields on `User`): token, `expiresAt`
- [ ] Initial Prisma migration
- [ ] `PrismaService`/`PrismaModule`

**Auth module**
- [ ] `POST /auth/register` — validate email/password/phone(optional), hash password (bcrypt), create unverified `User`, generate verification token, send verification email
- [ ] `GET /auth/verify-email?token=...` — validate token + expiry, mark `User.verified = true`
- [ ] `POST /auth/login` — reject unverified users; check `Lockout` state; verify password; on repeated failures increment `failedLoginAttempts` and set `lockedUntil` past threshold; issue JWT (Bearer, per ADR-0001) on success
- [ ] `POST /auth/forgot-password` — generate reset token, email reset link (always respond generically to avoid email enumeration)
- [ ] `POST /auth/reset-password` — validate reset token + expiry, update `passwordHash`, invalidate token
- [ ] `JwtStrategy` + `JwtAuthGuard` for protected routes
- [ ] Rate limiting via `@nestjs/throttler` on `/auth/login`, `/auth/register`, `/auth/forgot-password`
- [ ] DTOs + `class-validator` rules for all auth endpoints

**Mail**
- [ ] `MailService` (nodemailer) pointed at MailHog SMTP in dev
- [ ] Verification email template (link with token)
- [ ] Password reset email template (link with token)

**Cross-cutting**
- [ ] CORS configured for frontend origin
- [ ] Global validation pipe + exception filter (consistent error shape)

## Frontend (React + TypeScript + Tailwind)

**Project scaffolding**
- [ ] Vite + React + TypeScript project
- [ ] Tailwind CSS setup
- [ ] `Dockerfile` for frontend service
- [ ] API client wrapper that attaches JWT from `localStorage` as `Authorization: Bearer <token>` (per ADR-0001)

**Auth state**
- [ ] `AuthContext`/hook: holds token + current user, persists token to `localStorage`, exposes login/logout
- [ ] `ProtectedRoute` wrapper redirecting unauthenticated users to `/login`

**Pages**
- [ ] `Register` — email, password, phone (optional); calls `POST /auth/register`; shows "check your email" state
- [ ] `VerifyEmail` — reads token from URL, calls `GET /auth/verify-email`, shows result
- [ ] `Login` — email/password; surfaces "not verified" and "locked out" error states distinctly
- [ ] `ForgotPassword` — email input, calls `POST /auth/forgot-password`
- [ ] `ResetPassword` — reads token from URL, new password form, calls `POST /auth/reset-password`
- [ ] `Home` (protected) — simple landing page after login

**Routing**
- [ ] Router wiring all pages above, protected route for `Home`

## QA

**Automated tests (backend unit tests, per grilling decision)**
- [ ] `AuthService.register` — creates unverified user, hashes password, does not store phone... (covers phone optional both provided/omitted)
- [ ] `AuthService.verifyEmail` — valid token verifies user; expired/invalid token rejected
- [ ] `AuthService.login` — rejects unverified user; rejects wrong password; issues JWT on success
- [ ] `AuthService.login` lockout — N failed attempts locks the account; locked account rejected even with correct password until `lockedUntil` passes
- [ ] `AuthService.forgotPassword` / `resetPassword` — valid token resets password; expired/invalid token rejected; old password stops working after reset

**Manual / end-to-end verification**
- [ ] Full flow: register → receive email in MailHog → verify → login → access protected `Home`
- [ ] Attempt login before verifying email → rejected with correct message
- [ ] Trigger lockout by repeated bad logins → confirm locked message, confirm unlock after cooldown
- [ ] Forgot password → reset via MailHog link → old password no longer works, new one does
- [ ] `docker-compose up` brings up frontend, backend, Postgres, MailHog together cleanly from a clean checkout
- [ ] CORS: frontend (separate origin) can call backend API without errors
- [ ] Responsive check of all pages (mobile width) since Tailwind is in use
