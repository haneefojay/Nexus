# ADR-0014: Submitted Inspection Immutability

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Submission atomically freezes responses/findings and records an audit event; corrections are explicit append-only amendments, never silent edits.

## Alternatives Considered

Allow privileged edits; mutable status/answers; document-only audit logs.

## Consequences

### Positive

Evidence credibility, reproducibility, and safer offline reconciliation.

### Negative

Correction workflow is more deliberate and storage grows.

## Revisit Conditions

Legal/operational requirements mandate a different controlled amendment model. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
