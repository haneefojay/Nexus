# Security Architecture

Security is layered around tenant isolation, server authority, private files, and auditable transitions.

## Controls

TLS, secure sessions, CSRF protection, input validation, rate limits, least-privilege service identities, private networking, encrypted storage/backups, dependency scanning, secret management, and immutable audit records.

## Secure design

Never trust tenant ID, role, actor, file key, transition eligibility, or timestamps solely from the client. Avoid detailed existence errors. Validate provider/webhook input.

## Assurance

Threat model and security requirements drive tests. Dependency and secret scanning run in CI. High/critical findings block release unless explicitly risk-accepted by an owner with expiry.
