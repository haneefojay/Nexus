# Reporting Architecture

Reports are asynchronous, authorized artifacts derived from immutable records.

## Generation

API records a report request and snapshot/version references. Worker renders a deterministic PDF/CSV, stores it privately, records checksum/status, and emits completion.

## Truth

Reports show source timestamps, organization timezone, template version, responses, evidence references, findings/actions, and verification. They do not infer predictive state.

## Access and retention

Status/download are tenant scoped. Downloads use short-lived URLs. Retries are idempotent and previous artifacts remain attributable or are superseded explicitly.
