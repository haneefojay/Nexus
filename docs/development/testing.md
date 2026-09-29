# Testing Strategy

- Unit: domain transitions, recurrence/timezone, validation, offline reducers, pure mappings.
- Integration: repositories, migrations/constraints/PostGIS, transactions, authorization, storage, queue idempotency.
- E2E: critical browser/API journeys, responsive/accessibility, offline execution/sync, cross-tenant denial.
- Contract: OpenAPI/shared DTO compatibility and error envelopes.
- Load: map/search/import/report/sync with realistic distributions.
- Security: auth abuse, CSRF, BOLA/tenant matrix, uploads, injection, replay, rate limits.

Tests use isolated organizations and deterministic clocks. CI must run unit/integration/build on every PR; phase gates add owning tests. Flaky tests are defects and may not be silently retried indefinitely.
