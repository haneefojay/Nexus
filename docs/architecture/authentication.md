# Authentication

MVP uses first-party email/password authentication with secure server-side sessions.

## Controls

Normalize email; verify ownership; hash passwords with Argon2id using reviewed parameters; use generic auth responses; rate-limit signup/sign-in/reset; store reset/verification token hashes with expiry and single use.

## Sessions

Opaque random session ID in `Secure`, `HttpOnly`, `SameSite=Lax` cookie; rotate on authentication/security changes; CSRF protection for state-changing requests; revoke current/all sessions; inactivity and absolute expiry.

## Boundary

Authentication proves user identity. Active organization membership and role are resolved per request and are not trusted from client claims.
