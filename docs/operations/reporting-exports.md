# Reporting and exports operations

Inspection PDFs are requested only for `SUBMITTED`, `REVIEW_REQUIRED`, `APPROVED`, or `CLOSED` runs. The API captures one immutable JSON snapshot from tenant-scoped source tables, hashes it, persists a request, and enqueues a deduplicated BullMQ job. Exports are limited to the documented asset, inspection, and finding datasets; their stable columns and rows are snapshotted before enqueueing. Workers render only the snapshots, write deterministic private keys, and persist checksum, size, completion, and expiry.

All request, status, retry, and download routes require a verified session, active membership, fixed-role permission, matching organization, request identity, and owned artifact. Download URLs are generated only after server-confirmed completion and expire quickly. Object keys and signed URLs are never returned in errors or logs. Duplicate API calls reuse the snapshot hash; duplicate worker delivery exits after completion.

Completed artifacts expire after `ARTIFACT_RETENTION_DAYS` (default 30). The hourly cleanup worker deletes only completed files whose expiry is past, then marks the record `EXPIRED` while preserving its immutable snapshot and audit identity. Failed rows remain visible and retryable. Operators investigate repeated failures through job ID/request ID correlation and the alert catalogue.
