# Non-Functional Requirements

| ID              | Measurable requirement                                                                                                  | Priority | Owning phase | Verification                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | --------------------------- |
| NFR-SEC-001     | All tenant-owned access establishes authenticated actor, membership, organization context, authorization, and ownership | Must     | Phase 1      | Cross-tenant security suite |
| NFR-SEC-002     | Secrets never enter source, client bundles, logs, or error responses                                                    | Must     | Phase 0      | Secret scan + review        |
| NFR-SEC-003     | Uploads enforce type, size, checksum, ownership, signed-URL expiry, and safe delivery                                   | Must     | Phase 3      | Integration + security      |
| NFR-SEC-004     | Login, reset, invitations, uploads, imports, and report generation are rate limited                                     | Must     | Phase 5      | Security tests              |
| NFR-PERF-001    | Normal CRUD p95 is below 400ms under expected MVP load                                                                  | Must     | Phase 5      | Load test                   |
| NFR-PERF-002    | Complex spatial query p95 is below 700ms for 10k organization assets                                                    | Must     | Phase 5      | PostGIS load test           |
| NFR-PERF-003    | Authenticated routes do not load blocking 3D assets                                                                     | Must     | Phase 1      | Bundle + Web Vitals review  |
| NFR-PERF-004    | Offline interaction responds from local storage without network wait                                                    | Must     | Phase 4      | Offline E2E timing          |
| NFR-REL-001     | Mutations vulnerable to retry are idempotent                                                                            | Must     | Phase 2      | Integration duplicate tests |
| NFR-REL-002     | Jobs retry with bounded backoff and dead-letter visibility                                                              | Must     | Phase 3      | Worker integration          |
| NFR-REL-003     | API and worker support graceful shutdown                                                                                | Must     | Phase 0      | Process integration         |
| NFR-REL-004     | Production backup retention and restore procedure are tested                                                            | Must     | Phase 5      | Restore drill               |
| NFR-SCALE-001   | One organization supports approximately 10k assets and hundreds of sites without sharding                               | Must     | Phase 5      | Synthetic load test         |
| NFR-SCALE-002   | 100k-row imports execute asynchronously and report row errors                                                           | Should   | Phase 5      | Import load test            |
| NFR-A11Y-001    | Product targets WCAG 2.2 AA for keyboard, focus, labels, contrast, errors, and reduced motion                           | Must     | Phase 5      | axe + manual + E2E          |
| NFR-A11Y-002    | Essential meaning never relies on color, hover, or animation alone                                                      | Must     | Phase 1      | Design review + E2E         |
| NFR-OBS-001     | Structured logs include request/job IDs, operation, organization, status, and latency without sensitive values          | Must     | Phase 5      | Log contract tests          |
| NFR-OBS-002     | Backend traces cover HTTP, DB, jobs, imports, reports, notifications, and field sync                                    | Should   | Phase 5      | Trace smoke test            |
| NFR-OBS-003     | Unhandled frontend/API/worker/sync/upload failures reach error monitoring                                               | Must     | Phase 5      | Fault injection             |
| NFR-DATA-001    | Canonical timestamps use UTC timestamptz and recurrence uses organization timezone                                      | Must     | Phase 1      | DB + timezone tests         |
| NFR-DATA-002    | Domain identifiers use UUIDv7 and sequential IDs are not exposed                                                        | Must     | Phase 1      | Schema integration          |
| NFR-DATA-003    | Submitted inspections and audit events are append-only                                                                  | Must     | Phase 2      | DB/domain tests             |
| NFR-OFFLINE-001 | No local mutation or evidence is silently lost across reload, retry, or reconnect                                       | Must     | Phase 4      | Offline E2E                 |
| NFR-OFFLINE-002 | Sync state explicitly distinguishes local persistence from server acceptance                                            | Must     | Phase 4      | E2E + UX review             |
