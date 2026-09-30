# Backup and restore

`scripts/backup.sh` creates an atomic operator set: PostgreSQL custom dump, private-object archive, sorted object manifest, metadata, and SHA-256 checksums. Store the set encrypted with access restricted separately from runtime credentials. The database and object archive must be retained as one recovery point; a database-only restore can leave evidence/report/export references unresolved.

Run `scripts/check-backup-restore.sh` only against disposable or approved non-production Compose infrastructure. It restores PostgreSQL into `nexus_restore_rehearsal`, validates checksums and the object archive, and checks tenant, inspection, report/export, immutable history, and field-sync references before deleting the disposable database. Production restore requires change approval, an isolated target, credential rotation, object restoration before traffic, migrations only after the restored version starts, readiness checks, and sampled authorized downloads.

The product specification does not authorize numeric production retention, RPO, or RTO values. Operators must set and approve them for the deployment environment; Phase 5 verifies procedure mechanics without inventing those policies. Never use these scripts with implicit production credentials or destructive defaults.
