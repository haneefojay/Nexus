# NEXUS

NEXUS is a spatial-first inspection-to-action and operational-evidence platform for distributed physical assets.

> Know what was inspected. Know what was found. Know what was fixed. Prove it.

## Current status

- **Current phase:** Phase 0 — Foundation / Setup
- **Next phase:** Phase 1 — Sites & Assets
- **Product source:** `docs/source/NEXUS-product-specification-and-phase-0-directive.md`
- **Roadmap:** `docs/roadmap/roadmap.md`

Phase 0 is establishing governance, documentation, architecture, local infrastructure, test foundations, and the monorepo. Business features are intentionally not being implemented yet.

## Repository layout

```text
apps/
  web/       Existing NEXUS marketing site; later hosts authenticated routes
  api/       NestJS/Fastify modular-monolith HTTP API shell
  worker/    BullMQ background-worker shell
packages/
  contracts/ Shared API-safe contracts and error codes
  ui/        Reusable operational UI and design tokens
  database/  Drizzle schema and migration infrastructure
  domain/    Framework-independent domain primitives
  validation/ Shared validation schemas where appropriate
  storage/   S3-compatible storage abstraction
  maps/      Map and geocoding provider interfaces
  auth/      Authentication integration boundary
  offline/   Field cache and synchronization primitives
  config/    Shared tool configuration
docs/        Product, architecture, security, roadmap, ADR, and traceability handbook
```

## Prerequisites

- Node.js 24+
- Corepack
- Docker with Compose

## Initial commands

```bash
corepack enable
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Local infrastructure and environment setup are being completed in Phase 0. Follow `docs/development/setup.md` once it is marked complete.

## Contributor entry points

1. Read `AGENTS.md`.
2. Read `docs/README.md`.
3. Read `docs/roadmap/roadmap.md`.
4. Read the current phase document and affected ADRs.
5. Follow `CONTRIBUTING.md`.
