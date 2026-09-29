# ADR-0003: PostgreSQL 18 and PostGIS

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use PostgreSQL 18 as the system of record and PostGIS 3.6 stable line for spatial data and queries.

## Alternatives Considered

Document database; separate geospatial service; older PostgreSQL baseline.

## Consequences

### Positive

Transactions, constraints, relational history, spatial indexes, and UUIDv7 support coexist.

### Negative

Operational expertise and extension/image compatibility are required.

## Revisit Conditions

Required hosting cannot support the locked versions or measured workload exceeds feasible tuning. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
