# Background Jobs

BullMQ handles work that is slow, scheduled, or retryable.

## Job classes

Imports, recurrence generation, notifications, report rendering, orphan cleanup, and retention tasks.

## Rules

Jobs carry IDs and references, not trusted authorization snapshots or large blobs. Handlers are idempotent, bounded, observable, and use exponential backoff with capped attempts. Permanent failures go to an inspectable failed state/dead-letter workflow.

## Consistency

Domain commits are not rolled back by notification failure. Critical enqueue intent uses transactionally recorded intent/outbox before dispatch. Shutdown stops intake, completes or releases active jobs, and closes clients.
