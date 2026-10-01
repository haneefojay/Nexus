# Deployment and rollback

1. Build immutable web, API, and worker artifacts from one commit; run format, lint, strict typecheck, tests, production builds, audit, secret scan, Playwright/axe, Docker smoke, restore rehearsal, and performance gates.
2. Validate configuration with `scripts/validate-environment.sh`; provide secrets from the deployment secret manager. Reports/exports must use a private S3-compatible bucket.
3. Back up PostgreSQL and object storage. Apply additive migrations once, before API/worker rollout. Start workers, API, then web; require liveness and dependency readiness before traffic.
4. Exercise `scripts/smoke-non-production.sh` on the approved target, including authenticated report/export checks through the normal UI.
5. Roll gradually. SIGTERM must drain HTTP and BullMQ work before the platform deadline.

Rollback application artifacts to the last compatible commit only when the additive schema remains compatible. Never rewrite or automatically reverse a committed migration containing durable domain history. For incompatible data defects, stop traffic/jobs, restore the verified recovery set into an isolated target, or ship an reviewed forward-fix. Phase 5 does not authorize production launch or Phase 6 release approval.

## Phase 6 release checklist

- Confirm the branch commit, `1.0.0-rc.1` version, migration range, Node/pnpm versions, `NEXT_PUBLIC_API_URL`, and image/archive digests in `release-manifest.json`.
- Require green `quality`, `infrastructure`, and `release-candidate` jobs for the same SHA. Do not substitute a prior run.
- Confirm migrations are append-only relative to the Phase 5 baseline and readiness reports the exact expected migration count/latest timestamp.
- Run migrations and seed/reset checks before the worker → API → web startup sequence.
- Confirm real-stack sign-in, PDF report, CSV export, offline reload, desktop/mobile axe, query/header log redaction, rolling API replacement, baseline-on-RC-schema compatibility, RC forward-fix, and SIGTERM exits.
- Obtain deployment target, secret manager, S3 provider, monitoring/incident destination, change window, approver, retention, RPO, and RTO decisions from operators. This repository intentionally does not invent them.

## Rollback and forward-fix checklist

1. Stop new traffic and queue intake; preserve the failing logs, manifest, image digests, and recovery set.
2. Roll application artifacts back only to the verified Phase 5 baseline when the additive RC schema remains compatible. `scripts/check-schema-compatibility.sh` rehearses this direction.
3. Verify health/readiness and a safe authenticated smoke before restoring traffic.
4. Prefer a reviewed forward-fix for schema/data defects; never rewrite migration history or silently reverse durable domain data.
5. If application rollback is unsafe, restore the database and object archive together into an isolated target, validate referenced objects and invariants, then follow the approved recovery/change process.
