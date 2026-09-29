# Local Services

Local infrastructure mirrors production boundaries without attempting production scale.

- PostgreSQL 18 with PostGIS 3.6 is authoritative.
- Redis supports BullMQ and must not contain exclusive domain state.
- MinIO emulates S3-compatible object storage.
- Mailpit captures development email.

Health checks in `compose.yaml` are the source of truth for service readiness. Applications must not silently fall back to in-memory production behavior when a dependency is unavailable.
