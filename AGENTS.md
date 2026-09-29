# NEXUS Agent Instructions

## Project identity

NEXUS is a spatial-first inspection-to-action and operational-evidence platform for distributed physical assets. Its core lifecycle is:

`Asset → Inspection → Finding → Corrective Action → Evidence → Verification → History`

Product principle:

> Know what was inspected. Know what was found. Know what was fixed. Prove it.

NEXUS is not an EAM, CMMS, generic FSM, IoT/SCADA platform, ERP, GIS replacement, predictive-maintenance system, AI operations product, or digital twin in the MVP.

## Source-of-truth hierarchy

When sources conflict, use this precedence and document the conflict:

1. `docs/source/NEXUS-product-specification-and-phase-0-directive.md`
2. Accepted ADRs in `docs/decisions/`
3. `docs/product/domain-rules.md`
4. Generated OpenAPI contract
5. `docs/roadmap/roadmap.md` and the current phase document
6. Existing implementation
7. Agent assumptions

Never silently choose a lower-precedence source. Correct the lower source or raise a documented blocking issue.

## Required workflow

Before coding:

1. Read this file.
2. Read `docs/roadmap/roadmap.md`.
3. Read the current phase document.
4. Read affected requirements and ADRs.
5. Inspect the existing implementation.

During coding:

1. Implement only the current phase and affected requirements.
2. Prefer the smallest production-quality change.
3. Keep domain behavior server-authoritative.
4. Add or update tests with behavior.
5. Preserve API and data contracts unless the approved change updates them.
6. Update documentation when behavior changes.
7. Avoid unrelated refactors.

Before completion:

1. Run format check, lint, typecheck, tests, and build.
2. Run relevant security and migration checks.
3. Verify the phase Definition of Done.
4. Update roadmap status and `CHANGELOG.md`.
5. Commit only complete, reviewable work.

## Scope discipline

Do not:

- expand MVP scope without updating the authoritative product specification;
- introduce AI, telemetry, predictive claims, or native mobile without explicit approval;
- introduce microservices, Kubernetes, or service-mesh infrastructure;
- create generic work-order, billing, inventory, routing, scheduling, or CRM features;
- add dependencies without applying the dependency policy;
- create unnecessary abstractions or packages;
- replace accepted architecture casually;
- use front-end mock data as product functionality.

## Architecture rules

- Monorepo: pnpm + Turborepo.
- Architecture: modular monolith plus one worker process.
- Web: Next.js 16.x, React 19.x, TypeScript, Tailwind CSS 4.x, Framer Motion.
- API: NestJS 11 with Fastify.
- Database: PostgreSQL 18 + PostGIS 3.6.x.
- Data access: Drizzle ORM; isolate and document raw PostGIS SQL.
- Authentication: current stable Better Auth.
- Maps: MapLibre GL JS; MapTiler initially behind provider interfaces.
- Offline: mobile-first PWA, Serwist, Dexie/IndexedDB, ordered idempotent commands.
- Jobs: BullMQ + Redis; PostgreSQL remains the system of record.
- Storage: authorized S3-compatible storage with short-lived signed URLs.
- API: REST under `/v1`, generated OpenAPI, consistent errors, pagination, validation, authorization, and idempotency.
- Tenancy: every tenant-owned query and mutation is organization scoped.
- Marketing 3D remains separate from the operational product.

## Security rules

- Frontend authorization is never authoritative.
- Establish authentication, membership, organization context, authorization, and resource ownership on every request.
- Never trust browser-supplied `organizationId`, actor identity, roles, or state transitions.
- Validate all input server-side.
- Never expose arbitrary storage keys or files without authorization.
- Do not commit or log secrets, credentials, signed URLs, or sensitive file content.
- Audit events and submitted inspection history are append-only.
- Test cross-tenant access, role access, and attachment access explicitly.

## Database rules

- Every schema change uses a versioned migration.
- Never edit production schema manually.
- Use transactions for multi-record domain operations.
- Define explicit indexes and database constraints for important invariants.
- Use PostGIS geometry types and GiST indexes for spatial data.
- Store time in UTC using `timestamptz`; apply organization timezone for recurrence and display.
- Use UUIDv7 for domain identifiers.
- Prefer archive/deactivate semantics for historical operational records.

## API rules

- Prefix API routes with `/v1`.
- Keep controllers thin; domain transitions belong in application/domain services.
- Use the standard error envelope with stable error codes and request IDs.
- Validate bodies, parameters, IDs, coordinates, ownership, files, and transitions.
- Use cursor pagination for large collections.
- Use explicit allowlists for sort fields.
- Use `Idempotency-Key` or command IDs where retries can duplicate work.
- Keep generated OpenAPI synchronized with the implementation.

## Offline rules

- Offline scope is field inspection execution only.
- Use Dexie/IndexedDB, never localStorage, for field state.
- Use ordered command synchronization; do not introduce CRDTs.
- One active executor/device owns an inspection run.
- Commands are idempotent and expose explicit sync states.
- Never silently lose local changes or attachments.
- Never present local-only data as safely synchronized.

## Product truth rules

- Every authenticated product value must come from actual backend data.
- Seeded demo values must be generated by real records and calculations.
- Do not claim adoption, savings, uptime, prediction, intelligence, or performance without evidence.
- Prefer concrete operational language: inspection, finding, corrective action, evidence, verification, condition, and history.

## TODO policy

Use `TODO(<issue-or-roadmap-reference>)` only for intentional, tracked deferral. Do not use TODOs as a substitute for the roadmap or technical-debt register.
