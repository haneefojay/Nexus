# System Context

The system boundary includes the web/PWA, API, worker, and their controlled data services.

## Diagram

```mermaid
flowchart LR
  U[Operations and field users] -->|HTTPS| W[Next.js Web/PWA]
  W -->|JSON API / secure cookie| A[NestJS API]
  A --> P[(PostgreSQL 18 + PostGIS)]
  A --> R[(Redis)]
  A --> O[(S3-compatible storage)]
  R --> Q[BullMQ Worker]
  Q --> P
  Q --> O
  Q --> E[Email provider]
  W --> M[Map/geocoding provider]
  A --> M
```

## Trust boundaries

Browser input, uploaded files, provider responses, queue payloads, and email callbacks are untrusted. The API is the authorization boundary. Object storage and map tokens use least privilege; database and Redis are private network services.
