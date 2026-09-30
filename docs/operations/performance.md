# Phase 5 performance methodology

The reproducible gate `scripts/check-phase-five-performance.sh` creates one disposable tenant with 250 sites and 10,000 PostGIS assets inside a rolled-back transaction. PostgreSQL `statement_timeout` enforces the 700 ms complex viewport/search ceiling while retaining tenant predicates, persistence, and indexes. The worker benchmark parses 100,000 deterministic import rows, renders a 10,000-row escaped CSV, and renders a 100-item PDF snapshot with explicit bounded limits.

Normal API CRUD target is p95 <400 ms and complex spatial target is p95 <700 ms. CI reports machine, dependency versions, volume, duration, and thresholds in job logs. Results are evidence for that environment only, not production capacity claims. Authorization, validation, queues, database writes, and private storage may not be bypassed in end-to-end load runs. Add indexes only from measured plans and as incremental migrations.
