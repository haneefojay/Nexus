# ADR-0005: MapLibre Renderer

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use MapLibre GL JS for authenticated product mapping.

## Alternatives Considered

Google Maps renderer; Mapbox-only SDK; DOM marker map.

## Consequences

### Positive

WebGL scale, open renderer, style control, and provider flexibility.

### Negative

Team owns more integration and performance discipline; tile terms still apply.

## Revisit Conditions

Accessibility/performance or provider compatibility cannot meet requirements. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
