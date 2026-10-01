# Deployment Architecture

Web, API, and worker are independently deployable artifacts from one repository.

## Environments

Local, test, staging, and production use the same environment contract with separate secrets and data. Build immutable images once and promote by digest.

## Release order

Backup/verify → run backward-compatible migrations once → deploy API/worker/web → readiness and smoke tests → observe. Expand/migrate/contract is required for breaking schema changes.

## Runtime

Stateless web/API replicas; private managed PostgreSQL/Redis/object storage; worker concurrency bounded by job class. Graceful shutdown drains HTTP and jobs. Rollback compatibility is documented per release.

## Phase 5 implementation

Deployment gates now validate required environment values, additive migration ordering through `0011`, private storage, dependency readiness, required workers, graceful termination, safe non-production smoke probes, fictional seed, recovery rehearsal, accessibility, secret patterns, dependency audit, and deterministic scale tests. Application rollback is allowed only while schema-compatible; durable migrations are forward-fixed or recovered from a verified isolated restore and are never rewritten.
