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
