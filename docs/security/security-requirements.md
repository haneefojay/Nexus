# Security Requirements

| ID      | Requirement                                                                   | Verification                   |
| ------- | ----------------------------------------------------------------------------- | ------------------------------ |
| SEC-001 | Deny-by-default tenant/resource authorization on every protected operation    | cross-tenant integration tests |
| SEC-002 | Argon2id passwords, generic auth errors, rate limits, token expiry/single use | auth security tests            |
| SEC-003 | Secure HttpOnly sessions, rotation/revocation, CSRF defense                   | browser/API tests              |
| SEC-004 | Strict validation, body/file/query limits, safe error mapping                 | fuzz/negative tests            |
| SEC-005 | Private files, short-lived URLs, checksum/type/size verification              | storage security tests         |
| SEC-006 | Server-derived actor/time and append-only audit                               | database/integration tests     |
| SEC-007 | Least-privilege service identities, managed secrets, TLS/encryption           | deployment review              |
| SEC-008 | Dependency, secret, and container scanning; high/critical gate                | CI evidence                    |
| SEC-009 | Backup restore and incident response are exercised                            | drill record                   |
| SEC-010 | Logs/traces redact credentials, tokens, sensitive payloads, and URLs          | observability tests/review     |
| SEC-011 | Offline replay/idempotency and current authorization are enforced             | offline security E2E           |
| SEC-012 | Rate and workload limits protect expensive search/map/import/report paths     | load/abuse tests               |
