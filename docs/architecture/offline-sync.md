# Offline Sync Architecture

The PWA supports assigned inspection execution under intermittent connectivity, not general offline
administration.

## Local model

Dexie/IndexedDB stores a versioned tenant/user/device-partitioned field package, immutable
run/template snapshots, responses, photo blobs, evidence checkpoints, and outbox. Secrets and signed
URLs are never persisted. Context changes quarantine rather than destroy unsynchronized work.
Schema upgrades preserve recoverable commands.

## Command protocol

Commands carry protocol/schema version, organization, user, device, run, monotonic sequence,
dependencies, occurrence time, and stable UUIDv7 idempotency identity. A Web Lock prevents duplicate
browser processors. Six bounded attempts use deterministic exponential backoff. Persisted server
acknowledgement, not transport success, marks synchronization.

The server stores tenant/user/device/run-bound outcomes and returns them for duplicate delivery.
Command handling reuses inspection, response, submission, evidence, audit, and notification models.
One active device binding exists per inspection run; it conveys attribution and ordering, not
privileged device trust.

## Conflict rules

Server state wins. Membership loss, reassignment, terminal run state, archived targets, another
active device, or incompatible protocol/schema stops dependent commands. Committed predecessors
remain committed; later work remains inspectable.

## UX and recovery

The UI distinguishes local draft, locally submitted, pending, syncing, retryable failure, conflict,
authentication required, permanent failure, and server accepted. Refresh, retry, recovery-record
download, and destructive discard remain explicit. Logout/context switches quarantine
unsynchronized work instead of deleting it.

Offline evidence stores the blob and immutable metadata, requests a fresh server-issued target-bound
authorization only while online, uploads without persisting the signed URL, then queues finalization.
Each checkpoint survives interruption; abandoned grants/objects remain subject to the Phase 3
cleanup worker.
