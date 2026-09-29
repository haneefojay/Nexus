# ADR-0008: Command-Based Offline Sync

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use versioned local work packages and an ordered idempotent command queue with explicit accepted/rejected/conflicted results.

## Alternatives Considered

Last-write-wins record replication; online-only; full local database replication.

## Consequences

### Positive

Deterministic retries, auditable conflicts, and bounded offline scope.

### Negative

Complex protocol and migration/testing burden.

## Revisit Conditions

Operational evidence supports a simpler model or requirements expand beyond bounded field execution. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
