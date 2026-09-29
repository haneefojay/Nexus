# ADR-0002: Modular Monolith and Worker

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use one NestJS modular-monolith API plus a separately deployed BullMQ worker, with explicit domain modules and package boundaries.

## Alternatives Considered

Microservices now; serverless functions per endpoint; a single undifferentiated application.

## Consequences

### Positive

Strong transactions and simpler operations while retaining extraction boundaries.

### Negative

Requires discipline to prevent cross-module coupling and one large deployment domain.

## Revisit Conditions

Measured scaling, availability, team autonomy, or regulatory needs justify extraction. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
