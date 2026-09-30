# Phase 4 Gap Analysis and Delivery Plan

## Baseline

- `dev` contains Phase 3 through merge commit `d6cfcd6b5cc8cbcfac8c05e33565af87eedd71d5`.
- Post-merge `dev` CI run `36754056688` completed successfully.
- The Phase 2 inspection lifecycle, Phase 3 evidence controls, tenant-scoped constraints,
  request-context authorization, immutable history, queues, and MinIO integration are the systems
  to extend.

## Gaps

| Definition-of-Done capability | Baseline gap                                                   | Planned increment                                                                    |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Installable mobile field PWA  | No manifest, service worker, install/update UX, or field route | Serwist worker, safe caching, manifest/icons, guarded update flow                    |
| Durable local execution       | `@nexus/offline` only defines command types                    | Dexie schema for context, snapshots, drafts, commands, evidence, and quarantine      |
| Explicit synchronization      | No field sync API or persisted command outcomes                | Versioned assignment and command endpoints with device ownership and replay          |
| Exactly-once effects          | Online endpoints do not persist offline command outcomes       | Tenant/user/device/run-bound idempotency records and authoritative replay            |
| Conflict recovery             | No offline conflict model or recovery UI                       | Deterministic conflict codes, refresh/discard/escalation records, partial-success UI |
| Offline evidence              | Online authorization/finalization only                         | Blob/checkpoint queue that requests fresh target-bound authorization online          |
| Offline E2E                   | Desktop/mobile online suites only                              | IndexedDB, reload, offline, reconnect, duplicate, conflict, and recovery coverage    |
| Operations and traceability   | No Phase 4 cleanup/observability/reporting                     | Bounded processor, cleanup eligibility, migration/smoke checks, report and matrices  |

## Vertical slices

1. **Inspection command spine:** pure queue state machine, durable schema, assignment cache, start,
   responses, local submission, server command replay, and unit/integration tests.
2. **Evidence and recovery:** capture blobs, authorize/upload/finalize checkpoints, interruption
   recovery, explicit conflicts, reauthentication, and safe quarantine.
3. **PWA and field UX:** installability, intentional caches, update guard, mobile accessibility,
   storage/unsupported states, and queue controls.
4. **System verification:** migrations, Docker smoke tests, desktop/mobile Playwright offline flow,
   regression gates, audit, documentation, and Phase 5 readiness.

No source-of-truth ambiguity blocks the first slice. The server remains authoritative; the device
identifier is an attribution and single-executor binding, not a privileged trusted-device model.
