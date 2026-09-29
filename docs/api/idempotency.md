# Idempotency

Require `Idempotency-Key` for inspection submission, import confirmation, offline sync commands, report requests, and other retry-prone commands. Scope records to organization, actor, route/operation, and canonical request hash. Same key + same payload returns the original status/body; same key + different payload returns conflict. Concurrent first attempts serialize. Retention must exceed the client retry window and background-job horizon.

Worker jobs also have deterministic job IDs and idempotent handlers. Idempotency prevents duplicate effects; it does not replace database uniqueness or transactions.
