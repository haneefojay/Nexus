# Contributing to NEXUS

## Before changing code

Read `AGENTS.md`, the roadmap, the current phase, affected requirements, and affected ADRs. Confirm the work belongs to the current phase.

## Branches

- `main` must remain releasable.
- Use short-lived `feature/<scope>`, `fix/<scope>`, or `docs/<scope>` branches.
- Avoid heavyweight Git-flow branches.

## Commits

Use Conventional Commit style where practical:

```text
feat(sites): add organization-scoped site creation
fix(auth): reject inactive memberships
docs(adr): record map provider abstraction
test(security): cover cross-tenant evidence access
```

Keep commits focused and do not mix unrelated refactors with feature work.

## Pull requests

Every PR must identify:

- roadmap phase;
- requirement IDs;
- affected ADRs;
- migrations;
- test coverage;
- security or tenancy impact;
- documentation and changelog changes.

Required checks: formatting, lint, typecheck, tests, build, and relevant security/migration checks.

## Architecture changes

Create or update an ADR before implementing a material architecture change. Do not reverse an accepted ADR without a documented revisit condition.

## Database changes

Every schema change requires a versioned migration and review of constraints, indexes, tenancy, rollback, and test fixtures.
