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

- [ ] All product and non-functional requirements have stable IDs.
- [ ] Every requirement maps to a phase and verification method.
- [ ] All accepted ADRs exist.

## Implementation

- [x] Preserve marketing site under `apps/web`.
- [x] Create initial pnpm/Turborepo structure.
- [x] Install UI/UX Pro Max.
- [ ] Create API and worker shells.
- [ ] Create package boundaries.
- [ ] Create Docker Compose and `.env.example`.
- [ ] Configure CI and dependency security checks.

## Validation

- [ ] `pnpm install`
- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Local infrastructure health checks
- [ ] Existing marketing site smoke test

## Documentation

- [x] Preserve the authoritative source specification.
- [x] Create root governance files.
- [ ] Complete product handbook.
- [ ] Complete architecture handbook.
- [ ] Complete API, database, security, and development handbooks.
- [ ] Complete roadmap phases 1–6.
- [ ] Complete traceability and Definition of Done.
- [ ] Update changelog at completion.

## Definition of Done

Phase 0 is complete only when every requirement in section 73 of the authoritative Phase 0 directive is satisfied. Until then, the roadmap must remain at Phase 0.
