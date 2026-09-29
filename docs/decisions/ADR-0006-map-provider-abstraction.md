# ADR-0006: Map Provider Abstraction

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Place tiles, geocoding, and provider identifiers behind typed ports; persist normalized product data separately.

## Alternatives Considered

Call one provider SDK throughout UI/API; build mapping infrastructure ourselves.

## Consequences

### Positive

Reduces lock-in and keeps provider terms/quotas localized.

### Negative

Lowest-common-denominator risk and adapter maintenance.

## Revisit Conditions

One provider-specific capability becomes a validated core differentiator worth coupling. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
