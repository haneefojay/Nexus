# Migrations

Migrations are ordered, reviewed, forward-only production artifacts. Local/test databases start empty and apply the full chain. CI verifies migration application on PostgreSQL 18 with PostGIS.

Use expand → backfill → switch → contract for incompatible changes. Large indexes use an operational plan; data backfills are restartable and observable. A release documents backup, expected locks/duration, compatibility window, verification query, and roll-forward/rollback strategy. Never edit an applied migration.
