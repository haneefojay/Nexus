# Offline Sync Architecture

The PWA supports assigned inspection execution under intermittent connectivity, not general offline administration.

## Local model

IndexedDB stores a versioned assigned-work package, draft responses/findings, local evidence blobs, and an ordered command queue. Sensitive data is minimized, partitioned by user/organization, and cleared on explicit sign-out subject to safe unsynced-work handling.

## Command protocol

Each command has UUID, type, schema version, inspection/session identity, monotonic sequence, client capture time, payload, and idempotency key. Batch response returns accepted, rejected, conflicted, server cursor, and authoritative state.

## Conflict rules

Submitted inspections and authorization are server authoritative. Draft execution is single-owner. Metadata conflicts are surfaced. Replay is safe through processed-command records and deterministic command handlers.

## UX and recovery

States are ONLINE, SYNCING, OFFLINE, PENDING, SYNC_ERROR, and SYNCED. Never show synced until server acknowledgment. Photos retry independently; local work survives refresh and transient auth/network failure.
