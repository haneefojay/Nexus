# Phase 3 Gap Analysis and Delivery Plan

**Baseline:** `dev` at `b552b2114deb692674215d3a4cfecdc1901438d0`; Phase 2 commit
`24bd6727baabf7fcbf5e4849cd480352fc174e44` is an ancestor. Post-merge CI run
`36713884632` passed.

## Existing foundations

- Phase 2 already provides the inspection-linked finding record, submitted-run immutability,
  tenant-composite constraints, request context/RBAC, activity events, persistent notification
  intents, BullMQ workers, authenticated inspection UI, and private object-storage interfaces.
- Migration `0004` and its Docker checks prove the inspection submission and notification baseline.

## Gaps mapped to the Phase 3 Definition of Done

1. **Finding lifecycle:** evolve `inspection_findings` with source/site/asset attribution, the
   authoritative lifecycle, dismissal reason, current state, and append-only transitions.
2. **Corrective actions:** add the one-per-finding aggregate, active-member assignment, explicit
   transitions, overdue calculation, idempotent creation, completion evidence, verification, and
   separation of duties.
3. **Evidence:** implement target-bound upload grants, immutable storage/evidence metadata,
   finalization verification, authorized downloads, and retry-safe orphan cleanup.
4. **Notifications/workers:** extend durable intents for finding/action assignment, reminders,
   completion, review, and verification without regressing inspection notifications.
5. **Operations:** add tenant-bounded queues, dashboard attention ordering, filters, drill-downs,
   and global site/asset/finding/action search.
6. **Security/history:** enforce active membership and fixed-role policies at every transition and
   append immutable activity and transition history with non-disclosing errors.
7. **Web:** add responsive finding/action/evidence/verification/search workflows with accessible
   loading, empty, validation, recovery, focus, keyboard, and reduced-motion states.
8. **Gates:** add unit, integration, storage/security, worker, desktop/mobile E2E, migration,
   infrastructure, build, lint, typecheck, format, and audit evidence.

## Source conflict resolved

The product specification is higher precedence than `docs/product/domain-rules.md`. Phase 3 uses
the specification's finding states (`ACKNOWLEDGED`, `IN_PROGRESS`) and corrective-action states
(`COMPLETED`, `VERIFICATION_REQUIRED`, `CANCELLED`). Return-for-work is
`VERIFICATION_REQUIRED → IN_PROGRESS`. This avoids silently following the lower-precedence
abbreviated state names.

## Vertical slices

1. Finding/action domain, migration, tenant-safe API, immutable history, and lifecycle tests.
2. Evidence authorization/finalization/download plus cleanup worker and security tests.
3. Notification intents/workers, timezone reminders, cancellation, retry, and deduplication.
4. Operational dashboard/search and authenticated responsive web workflows.
5. Full lifecycle E2E, Docker checks, traceability, completion report, final CI, and PR.

No blocking product or security ambiguity was found; the source-of-truth hierarchy resolves the
state-name differences.
