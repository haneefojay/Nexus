# Technology Stack

Technology choices are locked by accepted ADRs.

## Applications

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion; NestJS 11 + Fastify; BullMQ worker.

## Data and infrastructure

PostgreSQL 18, PostGIS 3.6 stable line, Drizzle ORM, Redis, S3-compatible object storage, SMTP/Mailpit, Docker Compose.

## Maps and quality

MapLibre renderer with provider abstraction; pnpm workspaces + Turborepo; ESLint, Prettier, Vitest, Playwright, GitHub Actions. Dependencies are exact or lockfile-pinned, audited, and reviewed under the dependency policy.
