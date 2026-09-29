# Notifications Architecture

MVP notifications are email records produced from committed domain events.

## Pipeline

Domain transition records notification intent → worker renders versioned template → provider sends → delivery state and attempts are stored.

## Semantics

Assignment, due/overdue, submission/review, and corrective-action events are deduplicated. User/organization timezones govern scheduling. Cancelled or obsolete notifications are suppressed.

## Failure

Retry transient failures; classify permanent failures; never claim delivery without provider acceptance; never roll back the underlying domain action.
