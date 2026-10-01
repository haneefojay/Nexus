# Disaster Recovery

Recovery prioritizes authoritative relational data and evidence integrity.

## Protection

Automated encrypted PostgreSQL backups with point-in-time recovery; object versioning/replication where available; infrastructure/configuration as code; Redis is not an authoritative business store.

## Targets

Initial planning targets: RPO ≤ 24 hours and RTO ≤ 8 hours until production/business requirements set stricter objectives. These are targets, not validated claims.

## Runbook

Declare incident, freeze risky writes, select restore point, restore isolated database/storage, verify migrations and tenant counts/checksums, rotate credentials if needed, smoke test, redirect traffic, reconcile queued work, and publish incident record.

## Testing

Perform and time restore exercises before release and at least quarterly; record gaps and owners.

## Phase 5 implementation

The recovery set couples a PostgreSQL custom dump with an archived private-object volume, sorted manifest, metadata, and SHA-256 checksums. CI restores the database into a disposable database, validates archive integrity, and checks tenant-owned inspection, report/export, immutable activity, and field-sync references. Production retention, RPO, and RTO remain explicit deployment decisions rather than inferred defaults.
