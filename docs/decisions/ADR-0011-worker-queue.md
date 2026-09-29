# ADR-0011: BullMQ Worker and Redis

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use BullMQ on Redis for imports, recurrence, notifications, reports, and cleanup in a separately deployed worker.

## Alternatives Considered

In-process cron/background promises; database-only queue; cloud-vendor queue.

## Consequences

### Positive

Retry/backoff, scheduling, visibility, and local parity.

### Negative

Redis and queue operations become production dependencies; exactly-once is not assumed.

## Revisit Conditions

Reliability/scale evidence favors a managed queue or database outbox executor. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
