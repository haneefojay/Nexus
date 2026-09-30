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
