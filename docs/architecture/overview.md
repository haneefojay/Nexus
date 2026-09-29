# Architecture Overview

NEXUS is a TypeScript modular monolith with a separately deployed queue worker. It optimizes for explicit domain boundaries, transactional consistency, tenant isolation, and incremental delivery.

## Runtime shape

`apps/web` is the Next.js PWA and preserved marketing site. `apps/api` is NestJS 11 on Fastify. `apps/worker` consumes BullMQ jobs. PostgreSQL 18 + PostGIS is authoritative; Redis supports queues/ephemeral coordination; S3-compatible storage holds files; SMTP delivers development and production email.

## Principles

One deployable API until evidence justifies extraction; domain rules do not live in controllers; tenant scope is mandatory at repositories; asynchronous work starts only after commit; immutable evidence/audit history is preserved; provider-specific code sits behind ports.

## Dependency direction

Apps compose modules. Domain and contracts packages have no infrastructure dependency. Database, storage, maps, auth, and offline adapters depend inward on contracts/interfaces. Cross-module writes use application services and transactions; background work uses durable job intent/outbox patterns as introduced by owning phases.
