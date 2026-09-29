# Authorization

Authorization is deny-by-default RBAC plus resource and state policy.

## Decision inputs

Authenticated user, active membership, fixed role, organization ID, resource ownership, requested action, and current lifecycle state.

## Enforcement

Application services invoke centralized policies; repositories require tenant scope; queues re-resolve authority when needed. UI hiding is convenience only.

## Verification

Every protected endpoint has allow/deny tests, including cross-tenant guessed IDs, nested resource mismatch, stale membership, role downgrade, object downloads, imports, reports, and offline commands.
