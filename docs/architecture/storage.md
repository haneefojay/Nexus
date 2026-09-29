# Object Storage Architecture

Evidence and reports use private S3-compatible object storage behind server authorization.

## Upload

API validates actor, target, type, size, and intent; issues a short-lived target-bound upload URL and opaque server key. Finalization HEADs the object, verifies metadata/checksum, and writes attachment/provenance atomically.

## Download

Clients request resource authorization; API issues short-lived download URLs. Buckets are never public and raw object keys are not permissions.

## Lifecycle

Malware/content validation can quarantine objects. Orphans are cleaned after a grace period. Retention follows tenant/legal policy; deletion creates an audit event and respects immutable records.
