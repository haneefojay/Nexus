# Domain Rules

This document is authoritative for business invariants. API handlers and workers call domain policies; clients never define authorization or transitions.

## Tenancy and identity

1. Every tenant-owned row carries `organization_id`; repositories require organization context.
2. Membership must be active. Fixed MVP roles are Owner, Operations Manager, Field Technician/Inspector, Supervisor/Reviewer, and Viewer.
3. Resource lookup is tenant-scoped before authorization; inaccessible resources do not leak existence.
4. UUIDv7 identifies durable entities. Timestamps are stored in UTC and displayed in organization time.

## Lifecycle rules

- Site: `DRAFT → ACTIVE ↔ INACTIVE → ARCHIVED`. Archived is terminal in MVP and blocks new operational work.
- Asset: `DRAFT → ACTIVE ↔ INACTIVE → ARCHIVED`. Parent must share tenant and site; cycles and self-parenting are forbidden.
- Template draft may change; each published version is immutable, numbered, checksummed, and remains readable.
- Run: `PLANNED → READY → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → CLOSED`; explicit cancellation/skip requires reason. Submitted responses are immutable.
- Finding: `OPEN → ACTION_REQUIRED → IN_REMEDIATION → READY_FOR_VERIFICATION → VERIFIED/CLOSED`; `DISMISSED` requires authorized reason. Critical findings require verification before closure.
- Corrective action: `OPEN → IN_PROGRESS ↔ BLOCKED → READY_FOR_VERIFICATION → VERIFIED/CLOSED`; completion requires configured notes/evidence.

## Inspection and recurrence

- Only active targets and published template versions generate runs.
- Recurrence is interpreted in the organization IANA timezone; persisted instants are UTC. DST gaps advance to the next valid instant; ambiguous times use the earlier offset and are tested.
- Generation is idempotent per plan and recurrence window. Drafts do not count as completed coverage.
- One device/executor owns an in-progress run. Submission validates required answers and evidence in one transaction and is idempotent.

## Evidence and audit

- Object keys are server-issued and never authorize access by themselves.
- Finalization verifies target, tenant, media type, size, checksum, and object existence.
- Provenance and activity events are append-only. Actor identity and request metadata are server-derived.
- Reports reference immutable submitted records/snapshots; later edits never rewrite prior reports.

## Offline and idempotency

- Offline commands have stable IDs, sequence, timestamp, payload version, and idempotency key.
- Processed command IDs are retained long enough for safe replay. Batch results distinguish accepted, rejected, and conflicted commands.
- Server state wins for authorization and submitted records; unresolved metadata conflicts are explicit, never silent last-write-wins.
