# Phase 5 gap analysis and delivery plan

Date: 2026-09-30
Baseline: `dev` at `7f584c1e29618bf2fcf9b433bd45f8685712d366`, containing Phase 4 commit `f53d67d98c8cb8f4e425b2daf6cfeec6f60e34b6`. Post-merge CI run `36761210193` passed.

## Baseline assessment

Phase 1–4 provide verified sessions, active tenant membership, fixed roles, tenant-composite constraints, inspection-to-action history, private evidence storage, BullMQ workers, idempotent field synchronization, offline PWA behavior, dependency readiness, and graceful shutdown. Phase 5 began without persisted report/export artifacts, asynchronous reporting workers, report/export UI, structured correlation across every boundary, complete production hardening, measured load evidence, or exercised recovery automation.

## Definition-of-Done map

| Track                      | Initial gap                                                             | Planned evidence                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reports                    | No report records, renderer, worker, or UI                              | Immutable snapshot request, deduplicated BullMQ job, deterministic PDF, private object, authorized status/retry/download, integration and E2E tests |
| Exports                    | No asset/findings/inspection export artifacts                           | Stable UTC-aware CSV schemas, formula neutralization, async artifact lifecycle, tenant authorization and load tests                                 |
| Dashboard                  | Existing inspection/finding queries require definition and scale review | Server calculations, indexes justified by query plans, metric definitions and tests                                                                 |
| Accessibility              | Semantics exist but no complete WCAG 2.2 AA review/automation           | axe-backed desktop/mobile tests plus manual keyboard, zoom, contrast and screen-reader checklist                                                    |
| Observability              | Partial JSON worker logs and framework logging only                     | Redacting structured logger, request/job correlation, OpenTelemetry abstraction, safe error capture tests                                           |
| Health/alerts              | PostgreSQL/Redis readiness foundation only                              | Bounded PostgreSQL, Redis, storage, migration and worker checks; alert catalogue and runbooks                                                       |
| Security                   | Strong tenant/file foundations; hardening incomplete                    | Rate limits, headers, origin/body controls, report/export replay and cross-tenant tests, audit/secret scans                                         |
| Performance                | No measured Phase 5 scale results                                       | Deterministic 250-site/10k-asset/100k-import fixtures and recorded CRUD, spatial, search, dashboard, report/export results                          |
| Recovery                   | Architecture notes only                                                 | Safe PostgreSQL/object manifest backup, disposable restore rehearsal and invariant verification                                                     |
| Deployment                 | Local compose/CI foundation only                                        | Validated config, migration ordering, probes, rollback/forward-fix and safe non-production smoke scripts                                            |
| Demo                       | No complete fictional operational dataset                               | Deterministic idempotent real-backend seed and reset instructions                                                                                   |
| Documentation/traceability | Phase 5 mappings are planned, not evidenced                             | Architecture, runbooks, requirements/tests, changelog, roadmap and final report updated only after gates pass                                       |

## Delivery order

1. Inspection PDF vertical slice across persistence, API, worker, private storage, authorization, UI and tests.
2. Shared artifact lifecycle and the three required CSV exports.
3. Dashboard truth/index review and accessibility remediation.
4. Logging, tracing, error monitoring, readiness, alerts and security hardening.
5. Deterministic load suites, backup/restore rehearsal, deployment/rollback checks and fictional demo.
6. Full regression, Docker, desktop/mobile E2E, accessibility, security, recovery and performance gates; then final traceability and Phase 5 report.

## Explicit policy note

The source documents require artifact expiry but do not specify a duration. The first report slice uses a clearly visible 30-day completed-artifact expiry as an interim MVP policy. It is isolated in the worker and must be moved to validated environment configuration before Phase 5 completion; the final report will record the accepted value and cleanup behavior. No artifact is deleted by this slice.
