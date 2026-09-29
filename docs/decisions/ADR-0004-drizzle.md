# ADR-0004: Drizzle ORM

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use Drizzle for typed schema/query composition while retaining SQL migrations and direct SQL for advanced PostGIS/locking paths.

## Alternatives Considered

Prisma; TypeORM; raw SQL only.

## Consequences

### Positive

Thin abstraction, SQL visibility, and better escape hatches for PostgreSQL-specific behavior.

### Negative

More repository conventions and hand-written SQL are needed.

## Revisit Conditions

Material correctness/tooling failure or sustained maintenance cost is demonstrated. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
