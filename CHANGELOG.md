# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- Phase 1 tenant-safe core schema for organizations, memberships, invitations, sites, asset types, assets, imports, and immutable activity events.
- Phase 1 domain policies and tests for lifecycles, fixed-role authorization, active-owner invariants, asset hierarchy, and import-row validation.
- Docker-backed Phase 1 migration checks for PostGIS indexes, tenant asset-type scope, cycle prevention, owner retention, and append-only audit history.
- Better Auth email/password routes with Argon2id credentials, verified-email enforcement, revocable database sessions, database-backed rate limits, and queued verification/reset email delivery.
- Authenticated organization creation with atomic owner membership and immutable creation audit event.
- CI authentication smoke coverage for persisted sign-up, Argon2id hashing, verification records, and rejection of unverified sign-in.

- Phase 0 pnpm/Turborepo monorepo with preserved Next.js marketing site, NestJS/Fastify API shell, BullMQ worker shell, and shared package boundaries.
- Authoritative source archive and complete product, architecture, API, database, security, development, roadmap, ADR, and traceability handbooks.
- Stable functional/non-functional requirement IDs, domain rules, edge-case catalogue, phase/test mappings, and Definition of Done.
- PostgreSQL 18/PostGIS migration foundation; Redis, MinIO, and Mailpit local Compose services.
- Health/readiness endpoints, OpenAPI shell, graceful shutdown, strict TypeScript, ESLint, Prettier, Vitest, Playwright foundation, and GitHub Actions CI.
- UI/UX Pro Max project skill, design-resource policy, design-system master, and responsive marketing smoke test.

### Changed

- Moved the existing NEXUS website to `apps/web` and upgraded its foundation to Next.js 16.3, React 19.3, and Tailwind CSS 4.
- Corrected illustrative marketing language to avoid implying live telemetry or predictive-maintenance capability in MVP.
- Updated NestJS 11, Fastify, Drizzle, and transitive dependencies to patched versions.

### Fixed

- Aligned API and worker tests with the shared Vitest discovery convention.
- Added deterministic package-manager supply-chain policy and patched dependency overrides.

### Security

- Added threat model, tenant-isolation, file-security, incident-response, dependency-audit, session, idempotency, and cross-tenant testing requirements.
- Dependency audit reports no known vulnerabilities at Phase 0 validation.
- GitHub Actions quality and Docker infrastructure gates pass on the completed Phase 0 baseline.

### Deprecated

- Unsupported live-telemetry and predictive-maintenance positioning for the MVP.
