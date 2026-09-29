# Tenant Isolation

Organization is the security partition. Every tenant row carries `organization_id`; repository methods require it; unique constraints and indexes are tenant-scoped. Queries start from organization context and verify nested parent consistency. Background jobs carry organization/resource references and re-resolve records; object keys include non-guessable server prefixes but never substitute for authorization.

High-risk tests use two organizations and assert no read, write, count, search, map feature, error detail, timing-sensitive metadata, file, report, import, notification, audit event, or offline command crosses the boundary. Production database roles use least privilege. PostgreSQL RLS may be added as defense in depth only after policy and connection-pooling design; application scoping remains mandatory.
