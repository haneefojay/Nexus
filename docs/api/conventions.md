# API Conventions

- Stable base path: `/api/v1`; nouns for resources and explicit command subresources for transitions.
- JSON uses camelCase; timestamps are ISO 8601 UTC; dates without time are `YYYY-MM-DD`; IDs are UUIDv7 strings.
- Validate body, path, query, content type, size, bbox, sort/filter allowlists, and unknown fields.
- All responses carry/request a correlation ID. Never trust client actor, organization, role, audit timestamp, or object key.
- `GET` is safe; `PUT`/`DELETE` are idempotent by semantics; retryable commands use `Idempotency-Key`.
- OpenAPI and shared DTO contracts change in the same commit. Breaking changes require a version/migration plan.
