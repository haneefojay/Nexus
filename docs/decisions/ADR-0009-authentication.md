# ADR-0009: First-Party Session Authentication

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Use verified email/password, Argon2id, opaque server-side sessions in secure cookies, CSRF protection, and revocation.

## Alternatives Considered

JWTs in browser storage; passwordless-only; external identity provider as mandatory MVP dependency.

## Consequences

### Positive

Clear revocation, browser security, and low external coupling.

### Negative

Security-sensitive code and email deliverability must be operated carefully.

## Revisit Conditions

Enterprise SSO becomes required or a proven managed provider materially lowers risk. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
