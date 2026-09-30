# Deployment and rollback

1. Build immutable web, API, and worker artifacts from one commit; run format, lint, strict typecheck, tests, production builds, audit, secret scan, Playwright/axe, Docker smoke, restore rehearsal, and performance gates.
2. Validate configuration with `scripts/validate-environment.sh`; provide secrets from the deployment secret manager. Reports/exports must use a private S3-compatible bucket.
3. Back up PostgreSQL and object storage. Apply additive migrations once, before API/worker rollout. Start workers, API, then web; require liveness and dependency readiness before traffic.
4. Exercise `scripts/smoke-non-production.sh` on the approved target, including authenticated report/export checks through the normal UI.
5. Roll gradually. SIGTERM must drain HTTP and BullMQ work before the platform deadline.

Rollback application artifacts to the last compatible commit only when the additive schema remains compatible. Never rewrite or automatically reverse a committed migration containing durable domain history. For incompatible data defects, stop traffic/jobs, restore the verified recovery set into an isolated target, or ship an reviewed forward-fix. Phase 5 does not authorize production launch or Phase 6 release approval.
