# Local Services

Local infrastructure mirrors production boundaries without attempting production scale.

- PostgreSQL 18 with PostGIS 3.6 is authoritative.
- Redis supports BullMQ and must not contain exclusive domain state.
- MinIO emulates S3-compatible object storage.
- Mailpit captures development email.

Health checks in `compose.yaml` are the source of truth for service readiness. Applications must not silently fall back to in-memory production behavior when a dependency is unavailable.

## Image provenance

The MinIO Community Edition image is pinned by digest from the community-maintained `ghcr.io/coollabsio/minio` build because upstream stopped publishing Community Edition container images. The source/build provenance must be reviewed before changing the digest; this image is for local development and CI only. Production object storage must be a supported private S3-compatible service.
