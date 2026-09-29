# Local Development Setup

## Prerequisites

- Node.js 24 or later
- Corepack
- Docker with Compose

## Install

```bash
cp .env.example .env
corepack enable
pnpm install
```

Never commit `.env`. Replace all placeholder secrets outside local development.

## Start local infrastructure

```bash
docker compose up -d
docker compose ps
```

Services:

| Service            | Address          | Purpose                              |
| ------------------ | ---------------- | ------------------------------------ |
| PostgreSQL/PostGIS | `localhost:5432` | System of record and spatial queries |
| Redis              | `localhost:6379` | BullMQ and transient coordination    |
| MinIO API          | `localhost:9000` | S3-compatible evidence storage       |
| MinIO console      | `localhost:9001` | Local storage administration         |
| Mailpit SMTP       | `localhost:1025` | Development email delivery           |
| Mailpit UI         | `localhost:8025` | Development email inspection         |

## Start applications

```bash
pnpm dev
```

During early Phase 0, only the preserved web application is runnable. API and worker shells are tracked in the Phase 0 checklist.

## Quality checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Stop services

```bash
docker compose down
```

Use `docker compose down -v` only when intentionally deleting local development data.
