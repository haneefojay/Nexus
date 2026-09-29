# Observability

NEXUS uses structured logs, metrics, traces, health signals, and error monitoring without exposing secrets or tenant content.

## Telemetry

Propagate request/trace/job IDs across web, API, database, queue, worker, storage, and email. Logs are JSON with environment, service, version, route/job, duration, outcome, and safe identifiers.

## Signals

API latency/error/saturation; database pool/query latency; queue depth/age/failure; sync acceptance/conflict; upload/report latency; web vitals and client errors.

## Operations

`/health` is process liveness; `/ready` checks required dependencies. Alerts have owner, threshold, runbook, and severity. Sampling and redaction protect privacy.
