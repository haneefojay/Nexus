# Changelog

## Phase 5 — Reporting & Hardening

- Added immutable asynchronous inspection PDF reports and operational CSV exports with private storage, tenant authorization, deduplication, retries, expiry, cleanup, and real-state UI.
- Replaced remaining dashboard ambiguity with authoritative metric definitions and an indexed tenant/site coverage query.
- Added WCAG 2.2 AA axe gates and resolved blocking control-name and contrast defects across desktop/mobile public and authenticated flows.
- Added redacting structured logs, W3C request/job correlation, safe error capture, dependency/worker readiness, security headers, origin/body controls, and expensive-route limits.
- Added authenticated CRUD, 10k-asset PostGIS/search, 100k-import, report/export performance gates; PostgreSQL/object backup and disposable restore rehearsal; deployment/rollback runbooks; and a deterministic real-service fictional demo.
- Preserved all Phase 1–4 tenant, history, evidence, notification, PWA, offline, and exactly-once synchronization contracts.

## Phase 4 — Offline Field

- Added installable field PWA, Dexie persistence, safe service-worker caching and upgrades, mobile
  offline inspection execution, local submission, explicit sync/recovery states, and context
  quarantine.
- Added ordered UUIDv7 commands, device/run ownership, persisted idempotency outcomes, bounded retry,
  conflicts, immutable sync activity, and versioned field synchronization APIs.
- Extended evidence capture through local blobs, fresh server-authorized uploads, interrupted upload
  recovery, finalization checkpoints, and inspection-run evidence targets.
- Added IndexedDB, command-state, migration/constraint, dependency-audit, and desktop/mobile offline
  Playwright gates.

## Phase 3 — Findings & Actions

- Added tenant-safe finding and corrective-action lifecycles with immutable history, dismissal,
  assignment, due/overdue state, evidence-backed completion, verification, and closure.
- Added private target-bound S3/MinIO evidence authorization, finalization validation, provenance,
  secure downloads, and orphan cleanup.
- Added deduplicated action notifications, bounded delivery attempts, operational dashboards,
  global search, responsive authenticated workflows, and Phase 3 security/E2E gates.

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- Phase 2 controlled inspection templates with ordered response definitions and immutable published versions.
- Tenant-safe site/asset inspection plans with timezone-aware recurrence, active-user/role assignment, and bounded idempotent BullMQ run generation.
- Deterministic inspection execution, required-response validation, immutable submitted responses/findings, and optional review/approval closure.
- Deduplicated assignment, due, and overdue notification intents with retry-safe worker delivery and obsolete-notification suppression.
- Authenticated responsive inspection authoring, scheduling, execution, review, coverage, and attention interfaces.
- Phase 2 unit, migration, Docker lifecycle/security, and desktop/mobile Playwright gates.
- Phase 1 tenant-safe core schema for organizations, memberships, invitations, sites, asset types, assets, imports, and immutable activity events.
- Phase 1 domain policies and tests for lifecycles, fixed-role authorization, active-owner invariants, asset hierarchy, and import-row validation.
- Docker-backed Phase 1 migration checks for PostGIS indexes, tenant asset-type scope, cycle prevention, owner retention, and append-only audit history.
- Better Auth email/password routes with Argon2id credentials, verified-email enforcement, revocable database sessions, database-backed rate limits, and queued verification/reset email delivery.
- Authenticated organization creation with atomic owner membership and immutable creation audit event.
- CI authentication smoke coverage for persisted sign-up, Argon2id hashing, queued verification email, and rejection of unverified sign-in.
- Fixed-role membership invitation, acceptance, role-management, deactivation, and owner-retention workflows.
- Tenant-scoped site, asset-type, and asset CRUD/archive/search APIs with PostGIS viewport queries and immutable activity events.
- CSV preview, row-level validation, idempotent import jobs, and asynchronous BullMQ import processing.
- Authenticated overview, sites, assets, clustered map, team, and import web experiences backed by the real API.
- Responsive Playwright coverage and Docker-backed Phase 1 end-to-end smoke validation.

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

- Made Nest controller dependency injection explicit so source-mode integration checks and compiled production behavior resolve identical providers.

- Aligned API and worker tests with the shared Vitest discovery convention.
- Added deterministic package-manager supply-chain policy and patched dependency overrides.

### Security

- Added threat model, tenant-isolation, file-security, incident-response, dependency-audit, session, idempotency, and cross-tenant testing requirements.
- Dependency audit reports no known vulnerabilities at Phase 0 validation.
- GitHub Actions quality and Docker infrastructure gates pass on the completed Phase 1 baseline, including cross-tenant, spatial, import-worker, and audit checks.

### Deprecated

- Unsupported live-telemetry and predictive-maintenance positioning for the MVP.
