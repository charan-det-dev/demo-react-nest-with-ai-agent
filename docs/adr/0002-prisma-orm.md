# Prisma over TypeORM for the backend ORM

The backend is NestJS, whose docs and ecosystem default to TypeORM. We chose Prisma instead, for its stronger type-safety and simpler migration workflow. This is a deliberate deviation from the framework's idiomatic default, so future readers shouldn't assume TypeORM conventions apply — Prisma's schema file and generated client are the source of truth for models and migrations, not TypeORM entities/decorators.

Swapping ORMs later means rewriting the data access layer and migration history, so this is not a decision to revisit lightly.
