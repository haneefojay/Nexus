# Reporting Architecture

Reports are asynchronous, authorized artifacts derived from immutable records.

## Generation

API records a report request and snapshot/version references. Worker renders a deterministic PDF/CSV, stores it privately, records checksum/status, and emits completion.

## Truth

Reports show source timestamps, organization timezone, template version, responses, evidence references, findings/actions, and verification. They do not infer predictive state.

## Access and retention

Status/download are tenant scoped. Downloads use short-lived URLs. Retries are idempotent and previous artifacts remain attributable or are superseded explicitly.

## Phase 5 implementation

The API persists tenant-bound report/export requests with immutable JSON snapshots and SHA-256 hashes before enqueueing deduplicated BullMQ jobs. Workers render only those snapshots, use deterministic server-owned private keys, and persist checksum/size/completion/expiry. Completed objects remain private and are exposed only by short-lived authorization after active membership, fixed-role, tenant, request, and ownership checks. The hourly cleanup job deletes only expired completed objects, marks records expired, and retains snapshots for reproducibility. Operational exports are limited to the documented asset, inspection, and finding schemas and neutralize spreadsheet formulas.
