# Observability and redaction

NEXUS emits JSON logs through the shared observability package. HTTP records carry request ID, W3C trace ID, operation, status, duration, and organization ID only when an authorized tenant context exists. Report/export jobs preserve API correlation IDs. Safe error monitoring is an optional adapter: local development remains functional with no DSN or OTLP endpoint.

Redaction recursively removes passwords, authorization/cookie headers, session/reset/invitation tokens, signed URLs, object keys, evidence or artifact contents, secrets, and unnecessarily identifying payload values. Request and response bodies are not telemetry. Errors expose a stable classification rather than stack traces or infrastructure topology. Tests cover redaction and trace parsing.

Operators correlate an incident by `requestId`, `traceId`, and `jobId`; never copy signed links or private payloads into tickets. Monitoring exporters must be configured with data minimization and tenant-safe access controls.
