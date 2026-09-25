# Build context is the repo root (see docker-compose.yml) so npm workspaces can resolve.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci

FROM deps AS build
COPY backend ./backend
RUN npm exec --workspace=backend -- prisma generate
RUN npm run build --workspace=backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma

EXPOSE 3000
# Apply pending Prisma migrations against the real database before starting
# the app — a fresh `docker compose up` from a clean checkout has no schema
# yet, and the app would 500 on every request without this.
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/main.js"]
