# Threat Model

## Assets

Tenant inventory, inspections, findings/actions, evidence, reports, identities/sessions, audit history, and service credentials.

## Adversaries and boundaries

Unauthenticated attackers, malicious/compromised members, cross-tenant users, poisoned files/CSV, stolen sessions, dependency/supply-chain actors, and accidental operators. Trust boundaries exist at browser/API, API/data services, worker/queue, object storage, email/map providers, and deployment control plane.

## Priority threats

- Broken object-level authorization and tenant query omissions
- Session theft, CSRF, credential stuffing, reset abuse
- Unsafe uploads/downloads, CSV formula injection, object-key leakage
- Offline command replay/tampering and stale authorization
- SQL/HTML/template injection and excessive resource consumption
- Queue payload forgery, SSRF/provider misuse, secrets/log leakage
- Audit or submitted-record tampering; backup failure

Mitigations are specified in [security requirements](./security-requirements.md) and verified in mapped tests. Review at each phase and before release.
