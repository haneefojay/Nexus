# Observability

NEXUS uses structured logs, metrics, traces, health signals, and error monitoring without exposing secrets or tenant content.

## Telemetry

Propagate request/trace/job IDs across web, API, database, queue, worker, storage, and email. Logs are JSON with environment, service, version, route/job, duration, outcome, and safe identifiers.

## Signals

API latency/error/saturation; database pool/query latency; queue depth/age/failure; sync acceptance/conflict; upload/report latency; web vitals and client errors.

## Operations

`/health` is process liveness; `/ready` checks required dependencies. Alerts have owner, threshold, runbook, and severity. Sampling and redaction protect privacy.

## Phase 5 implementation

`@nexus/observability` provides redacting JSON logs, W3C trace parsing, correlation generation, and safe error capture. HTTP requests emit request/trace context, operation, status, and duration; every BullMQ contract carries a correlation ID, including email, imports, inspection generation, reports, exports, and cleanup. Worker failures expose job ID, operation, organization context when permitted, and safe classification without payloads, object keys, signed URLs, tokens, or evidence. Optional exporters are configuration-driven and do not block local operation.
