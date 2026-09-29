# Database Handbook

PostgreSQL 18 + PostGIS is authoritative. Drizzle supplies typed schema/query composition; reviewed SQL is expected for migrations, constraints, PostGIS, locking, and query plans. Redis is never the system of record.

Schema work must follow conventions, forward-only migrations, tenant isolation, indexing evidence, tests, and rollback/restore planning.
