# Phase 4 — Offline Field

## Goal

Provide reliable offline field inspection with explicit synchronization.

## Scope

- Installable PWA and field route
- Dexie local store and assignment/template cache
- Local inspection execution and photo blobs
- Ordered command queue, idempotency, retries, conflict rules
- Visible online/offline/pending/syncing/error/synced states
- Recovery after reload and interrupted upload

## Dependencies

Stable Phase 2/3 server contracts and evidence flow.

## Tests

Command ordering, duplicate delivery, device ownership, partial success, expired session, interrupted evidence upload, and automated offline Playwright E2E.

## Definition of Done

- [x] Technician completes and locally submits a synchronized inspection without network.
- [x] Reload preserves safe local state.
- [x] Reconnection syncs commands and evidence exactly once.
- [x] Conflicts and failures are explicit and recoverable.
- [x] Automated offline E2E verifies final server state.
