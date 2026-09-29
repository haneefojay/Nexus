# Phase 0 — Foundation

## Goal

Create a reliable engineering workspace that preserves the marketing site and makes the locked NEXUS product implementable without rediscovering requirements or architecture.

## Scope

- Documentation and governance
- Monorepo and package-manager setup
- Architecture, API, database, security, and offline foundations
- CI, linting, formatting, typecheck, and test foundations
- Local PostgreSQL/PostGIS, Redis, MinIO, and Mailpit infrastructure
- API/worker shells and health/readiness foundations
- Design tokens and marketing-site inventory
- UI/UX Pro Max installation and design-resource policy

Business features are explicitly excluded.

## Requirements

- [x] All product and non-functional requirements have stable IDs.
- [x] Every requirement maps to a phase and verification method.
- [x] All accepted ADRs exist.

## Implementation

- [x] Preserve marketing site under `apps/web`.
- [x] Create initial pnpm/Turborepo structure.
- [x] Install UI/UX Pro Max.
- [x] Create API and worker shells.
- [x] Create package boundaries.
- [x] Create Docker Compose and `.env.example`.
- [x] Configure CI and dependency security checks.

## Validation

- [x] `pnpm install`
- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build`
- [ ] Local infrastructure health checks
- [x] Existing marketing site smoke test

## Documentation

- [x] Preserve the authoritative source specification.
- [x] Create root governance files.
- [x] Complete product handbook.
- [x] Complete architecture handbook.
- [x] Complete API, database, security, and development handbooks.
- [x] Complete roadmap phases 1–6.
- [x] Complete traceability and Definition of Done.
- [ ] Update changelog at completion.

## Definition of Done

Phase 0 is complete only when every requirement in section 73 of the authoritative Phase 0 directive is satisfied. Until then, the roadmap must remain at Phase 0.
