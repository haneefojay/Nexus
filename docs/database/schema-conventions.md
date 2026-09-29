# Schema Conventions

Use snake_case tables/columns; plural table names; UUIDv7 `id`; `organization_id` on every tenant row; `created_at`/`updated_at` UTC timestamptz; explicit status constraints; normalized scoped unique indexes; foreign keys with deliberate delete behavior. Never cascade-delete operational history.

Geometry is SRID 4326 and validated. Money (if later needed) uses integer minor units plus currency. JSONB is for bounded evolving metadata, not core relations. Published/submitted/audit records are append-only or mutation-restricted. Every table documents owner, retention, PII class, and primary query patterns.
