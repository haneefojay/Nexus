# ADR-0007: Mobile-First PWA

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Deliver field workflows as a responsive installable PWA; do not build a native MVP app.

## Alternatives Considered

Native iOS/Android; React Native; desktop-only responsive site.

## Consequences

### Positive

One codebase, rapid iteration, installability, and sufficient offline scope for validation.

### Negative

Platform background/storage/camera limits require careful testing.

## Revisit Conditions

Field pilots prove browser limitations block reliable core work. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
