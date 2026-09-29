# Phase 0 Report

## Repository

The existing immersive marketing site is preserved in `apps/web`. The repository is now a pnpm/Turborepo monorepo with API and worker shells plus shared packages for contracts, domain, configuration, validation, database, storage, maps, authorization, offline protocol, and UI tokens.

## Documentation

The authoritative source specification is archived. Product, architecture, API, database, security, development, roadmap, traceability, domain-rule, edge-case, and Definition-of-Done handbooks are present with stable requirement IDs.

## Architecture

NEXUS is locked as a NestJS 11/Fastify modular monolith with a BullMQ worker, PostgreSQL 18/PostGIS system of record, Drizzle data access, Redis, private S3-compatible storage, MapLibre/provider ports, first-party sessions, and a mobile-first PWA. Business features remain outside Phase 0.

## Skills

UI/UX Pro Max is installed under `.agents/skills` and its use, 21st.dev evaluation, and design-resource policy are documented. The preserved marketing experience has desktop/mobile smoke coverage.

## Tooling

Install, format, lint, strict typecheck, unit-test foundation, production build, dependency audit, OpenAPI shell, health/readiness shell, Docker Compose, and GitHub Actions quality/infrastructure jobs are configured. CI supplies the Docker-enabled PostgreSQL/PostGIS, Redis, MinIO, and Mailpit runtime check unavailable in the agent sandbox.

## Decisions

ADR-0001 through ADR-0015 record every locked decision from product boundary through the 3D product boundary.

## Phase status

```text
Phase 0 — COMPLETE
Phase 1 — READY TO START
```

GitHub Actions run `36643465993` passed the quality and Docker infrastructure jobs on commit `469e23520a5a15f1f25abd68b1b4327cc612b72b`.

## Important warnings

- Product assumptions U1–U6 still require design-partner validation.
- The marketing site is preserved and clearly illustrative; it is not the authenticated MVP application.
- Phase 1 must add real schema/domain behavior incrementally and may not skip tenant-isolation tests.
