# Alert catalogue and runbooks

| Signal                      | Condition                                                         | First response                                                                                                |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| API readiness               | two consecutive non-ready probes                                  | inspect dependency component names, deploy/migration state, then PostgreSQL, Redis, storage, worker heartbeat |
| Worker unavailable          | readiness reports zero workers for a required queue for 2 minutes | verify worker process and Redis, stop new deployment, restart one worker, inspect failed jobs                 |
| Report/export failure       | 5 failures in 10 minutes or one request exhausts retries          | correlate request/job IDs, inspect safe error class, repair dependency, use authorized retry                  |
| Queue backlog               | oldest report/export job > 5 minutes                              | check worker saturation and dependency latency; scale only after confirming retries are bounded               |
| Storage failure             | two readiness failures or write/checksum error                    | block artifact readiness claims, verify private bucket policy and capacity                                    |
| Database/migration mismatch | any readiness failure                                             | halt rollout; apply expected forward migration or execute documented rollback/forward-fix                     |
| Restore drill               | checksum, archive, or invariant failure                           | preserve backup set, do not promote it, investigate before next retention rotation                            |
| Security                    | secret scan, cross-tenant, or high audit failure                  | stop release, rotate exposed material if applicable, follow incident response procedure                       |

Every alert links to this catalogue plus the deployment and backup/restore runbooks. Alerts contain identifiers and classifications only, never tenant payloads or private URLs.

## Phase 6 incident checklist

1. Declare the observed symptom and correlation/request/job IDs without copying tenant payloads, credentials, signed URLs, or query tokens.
2. Check component readiness in order: migration ledger, PostgreSQL, Redis/workers, private object storage, API, then web.
3. Stop rollout and new work for cross-tenant, secret exposure, migration mismatch, missing recovery object, or exhausted report/export retry findings.
4. Preserve the release manifest, image digests, logs, audit events, and recovery set; rotate exposed material through the operator-approved secret system.
5. Use the rollback/forward-fix checklist and the approved incident destination. No vendor, destination, severity owner, or response-time promise is assumed here.
