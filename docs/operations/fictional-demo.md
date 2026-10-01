# Fictional demo

The demo is labelled **Fictional Operations — Demo** and contains no real person, customer, credential, infrastructure, or location data. It uses real authentication hashing, tenant membership, PostgreSQL/PostGIS entities, inspection/version/run/response history, finding/action lifecycle records, a private evidence object, and normal report/export workers.

After migrations and healthy local services:

```bash
ALLOW_DEMO_SEED=true DEMO_PASSWORD='choose-a-local-demo-password' pnpm seed:demo
```

The seed uses deterministic UUIDv7 fixtures and upserts, so reruns are idempotent. It refuses production. Reset by deleting the dedicated fictional organization in an approved disposable database or recreating local Compose volumes; never run a reset against shared or production infrastructure.
