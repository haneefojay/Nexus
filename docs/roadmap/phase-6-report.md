# Phase 6 engineering report

## Outcome

NEXUS `1.0.0-rc.1` is a validated release candidate on `phase-6/release-candidate`. The Phase 6 code evidence commit is `1e58b0c7c6e83ecc749f9497002efdd5c857e2d1`, based on Phase 5/dev merge `6eb4bf5718fbfafb80e09f3e90b6b7bbcc8ae0f6`. No merge, tag, release publication, production deployment, domain/provider choice, or production policy was performed.

## Verified gates

- **Baseline and regression:** format, ESLint, strict TypeScript, Vitest, production builds, existing desktop/mobile Playwright, secret script, and high-severity dependency audit.
- **Artifacts:** web, API, and worker containers build from one commit. CI records image IDs, archive SHA-256 values, migration range, Node/pnpm versions, and build-time `NEXT_PUBLIC_API_URL` in the release artifact.
- **Startup and shutdown:** migrations and demo seed precede worker → API → web. Dependency readiness, rolling API replacement, and zero-exit SIGTERM draining pass. The web wrapper forwards termination and waits for Next.js.
- **Database:** all 12 migrations through `0011_phase_five_dashboard_index.sql` are present; readiness compares the applied count/latest timestamp. Hashes for Phase 0–5 migrations match the Phase 5 baseline.
- **Tenant/domain/security:** prior cross-tenant, role, immutable history, upload, offline replay, rate/workload, and safe-error gates remain green. Production-mode query/header sentinels are absent from API logs. GitHub Advanced Security secret scanning was unavailable for this repository; the repository secret scan and dependency audit remain passing evidence.
- **Real-stack truth:** the browser signs in through the real API; workers generate a PDF beginning `%PDF-` and an asset CSV containing the expected header; downloads use authorized private-object URLs.
- **Offline/mobile/accessibility:** the real service worker controls the field page before network loss; an offline reload succeeds. Real desktop and Pixel 7 contexts have no critical/serious axe findings. Agent manual evidence recorded keyboard sequences, accessibility trees, and zero horizontal overflow at 200%/320-CSS-pixel equivalent. Human screen-reader/high-contrast review remains an explicit approval activity, not fabricated evidence.
- **Performance/observability:** Phase 5 thresholds and volumes rerun unchanged. Readiness names failed dependencies; structured logging/error tests and redaction remain blocking.
- **Recovery:** database/object checksums pass; the object archive is extracted; every available evidence and completed report/export reference is present. The Phase 5 API reaches readiness on the RC schema, then the RC restarts as forward-fix. Numeric retention, RPO, and RTO were not invented.
- **Demo:** seed, reseed, and a disposable database reset produce one semantic fingerprint; the published template uses its real SHA-256 checksum.

## Evidence

- GitHub Actions run: https://github.com/haneefojay/Nexus/actions/runs/36812678014 (quality, infrastructure, and release-candidate jobs for the evidence SHA).
- Primary automation: `.github/workflows/ci.yml`, `scripts/check-release-containers.sh`, `scripts/check-migration-history.sh`, `scripts/check-demo-reset.sh`, `scripts/check-schema-compatibility.sh`, and `scripts/check-backup-restore.sh`.
- Accessibility record: `docs/operations/accessibility-review.md`.
- Release, rollback, incident, backup, security, and performance guidance: `docs/operations/` and `docs/security/security-requirements.md`.

## Limitations and approval boundaries

- The sandbox has no Docker daemon; Docker evidence is from GitHub Actions. Local static gates and the manual browser inspection were also run.
- The pinned MinIO fork is non-production rehearsal infrastructure; an operator must approve a maintained S3-compatible production service.
- Production provider, domain, secrets manager, monitoring/incident destination, retention, RPO/RTO, approver, and change window are unresolved by design.
- Human assistive-technology review is still required as a release approval activity.
- No production rollout was attempted. This report recommends RC review, not autonomous production launch.
