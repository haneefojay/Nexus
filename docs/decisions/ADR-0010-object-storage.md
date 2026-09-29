# ADR-0010: Private S3-Compatible Object Storage

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Store evidence/reports in private S3-compatible object storage using server-authorized short-lived upload/download URLs and finalization.

## Alternatives Considered

Database blobs; public buckets; proxy every byte through API.

## Consequences

### Positive

Scalable files, provider portability, and explicit authorization.

### Negative

Two-phase upload/finalization, orphan cleanup, and malware controls are required.

## Revisit Conditions

Compliance or scale requires a specialized managed content platform. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
