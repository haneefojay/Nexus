# Phase 6 — Release

## Goal

Validate the complete NEXUS MVP as release candidate `1.0.0-rc.1` without tagging, publishing, merging, choosing production vendors/policies, or deploying production.

## Scope

- Release candidate baseline and manifest
- Full regression, security, tenant/domain, offline/mobile, reports/exports, accessibility, observability, performance, and recovery gates
- Buildable web/API/worker artifacts, digests, startup order, replacement, and graceful shutdown
- Deterministic demo seed, reseed, and disposable reset
- Release, rollback, incident, evidence, traceability, roadmap, changelog, and limitation records

## Definition of Done

- [x] Production builds, format, lint, strict types, unit/E2E tests, audit, and migrations pass.
- [x] Tenant, role, attachment, offline, migration-history, and log-redaction security gates pass.
- [x] Real-stack sign-in, PDF report, CSV export, offline field reload, desktop/mobile axe, and reflow gates pass.
- [x] Backup restore validates database invariants and every referenced evidence/report/export object.
- [x] Phase 5 application rollback compatibility and RC forward-fix restart are rehearsed against the RC schema.
- [x] Container images are built from one commit; manifest/digests, worker → API → web startup, rolling API replacement, and SIGTERM draining are verified.
- [x] Demo seed, reseed, and disposable reset produce the same semantic fingerprint.
- [x] Performance thresholds are rerun unchanged and observability/readiness checks remain blocking.
- [x] Automated accessibility evidence is separated from agent-conducted manual evidence and human AT approval activity.
- [x] Final engineering report documents verified evidence, constraints, and deferrals.

Production launch remains a separate explicit approval. Provider, domain, secrets manager, monitoring/incident destination, retention, RPO/RTO, approver, and change window are intentionally not selected by this phase.
