# ADR-0001: Product Boundary

## Status

Accepted

## Context

The authoritative NEXUS product specification locks this decision to keep Phase 0 and later delivery coherent. NEXUS must remain tenant-safe, evidence-backed, operable by a small team, and truthful about MVP capabilities.

## Decision

Build an inspection-led spatial operations system for distributed energy O&M: inventory → planned inspection → evidence → finding → corrective action → verification → report. Exclude telemetry, predictive maintenance, AI diagnosis, general work orders, and native mobile from MVP.

## Alternatives Considered

A broad infrastructure intelligence/digital-twin platform; a generic FSM/CMMS; telemetry-first monitoring.

## Consequences

### Positive

A narrow wedge is credible, testable, and avoids false product claims.

### Negative

Some prospects will require excluded capabilities; positioning must remain disciplined.

## Revisit Conditions

Validated buyer demand requires a different wedge or the workflow cannot deliver value. Any replacement requires a superseding ADR, migration impact, security review, and updated traceability.

## References

- [Authoritative product specification](../source/NEXUS-product-specification-and-phase-0-directive.md)
- [Architecture overview](../architecture/overview.md)
