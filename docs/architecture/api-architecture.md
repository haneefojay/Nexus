# API Architecture

The API is versioned JSON over HTTPS, documented by generated OpenAPI and backed by shared contracts.

## Flow

Fastify adapter → request ID/rate limit/session → organization context → validation → application service → domain policy → tenant-scoped repository/transaction → response envelope. Controllers remain thin.

## Contracts

Stable `/api/v1` resource routes; explicit command routes for state transitions; cursor pagination; allowlisted filter/sort; machine-readable error codes; idempotency keys for retried mutations.

## Consistency

Multi-record transitions are transactional. Enqueue intent is recorded atomically or scheduled only after successful commit. Read models may be optimized without becoming authorization sources.
