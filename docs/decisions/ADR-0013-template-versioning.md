# ADR-0013: Immutable Template Versions

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Editable template drafts publish numbered immutable versions; inspection runs bind to an exact version/checksum.

## Alternatives Considered

Mutate templates in place; copy questions directly into each run only; unversioned JSON.

## Consequences

### Positive

Historical inspections remain interpretable and reports reproducible.

### Negative

More records and explicit publish/migration UX.

## Revisit Conditions

A validated authoring model requires a different immutable snapshot mechanism. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
