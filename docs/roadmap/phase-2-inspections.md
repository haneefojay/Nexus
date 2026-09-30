# Phase 2 — Inspections

**Status: COMPLETE**

## Goal

Deliver the complete online inspection lifecycle.

## Scope

- Controlled inspection templates and immutable published versions
- Plans, recurrence, run generation, assignments, due/overdue rules
- Guided checklist execution, responses, readings, notes, and findings entry
- Dashboard attention and inspection-coverage calculations
- Review/approval path where configured

## Dependencies

Phase 1 assets, authorization, audit events, worker scheduling foundation.

## Tests

State machines, recurrence/timezones, required responses, version immutability, run generation, assignment, execution, and submission E2E.

## Definition of Done

- [x] Manager can publish a template and create a recurring plan.
- [x] Worker creates controlled upcoming runs without materializing an unbounded future.
- [x] Technician can complete and submit an inspection online.
- [x] Submitted responses are immutable.
- [x] Due, overdue, coverage, and attention calculations are deterministic and tested.

## Baseline and gap analysis

- Phase 2 starts from `dev` commit `77417d2e1a0e2d7fc54596c945a225065636dbb6`; successful baseline CI run `36675881662` covers the Phase 1 tenant, asset, audit, queue, web, migration, and security foundations.
- The current database contains no inspection template, version, plan, run, response, or Phase 2 notification records.
- The domain package contains placeholder inspection statuses but no inspection transition rules, recurrence calculations, response validation, coverage, or attention calculations.
- The API and worker expose only Phase 1 operations and import/email jobs. Phase 2 controllers, transactional services, run-generation jobs, reminder jobs, and idempotency records are absent.
- The authenticated web application has no inspection authoring, scheduling, execution, review, or inspection-dashboard routes.
- Existing Phase 1 request context, fixed-role authorization, organization-scoped query patterns, immutable activity events, UUIDv7 identifiers, BullMQ worker, and responsive application shell are the required foundations and will be extended rather than duplicated.

## Implementation plan mapped to the Definition of Done

1. **Domain contracts and persistence**
   - Replace placeholder run states with the authoritative lifecycle.
   - Add deterministic state transitions, recurrence/timezone calculation, response definitions and validation, due/overdue, coverage, and attention calculations.
   - Add incremental inspection tables, constraints, indexes, immutable published-version protections, immutable submitted-response protections, and migration tests.
2. **Templates and publication**
   - Add organization-scoped draft authoring, ordered sections/items, supported response definitions, editing, publication, immutable numbered versions/checksums, permissions, audit events, and authenticated authoring UI.
   - Satisfies manager template publication and historical-version binding requirements.
3. **Plans and bounded scheduling**
   - Add site/asset targets, assignment by active eligible user or supported role, recurrence and organization-timezone scheduling, pause/resume, due windows, review requirement, and bounded generation horizon.
   - Add a retry-safe BullMQ generation job with database uniqueness as the idempotency boundary.
   - Satisfies recurring-plan and controlled upcoming-run generation requirements.
4. **Online execution and review**
   - Add run list/detail/start, response save, notes/readings, minimum Phase 2 finding entry, atomic submission, optional review/approval, close, assignment validation, and material-action audit events.
   - Enforce required responses and immutable submitted responses in the domain, application, and database layers.
   - Add guided responsive technician and reviewer interfaces with accessible states and recovery.
5. **Operations and notifications**
   - Add deterministic due/overdue projections, site coverage, attention ordering, dashboard APIs/UI, assignment/due/overdue email jobs, delivery deduplication, cancellation checks, and retry-safe worker behavior.
6. **Verification and completion**
   - Add unit, database/integration, worker, security, API contract, and desktop/mobile Playwright coverage for the complete template → plan → generated run → execution → submission → review path.
   - Run format, lint, strict typecheck, unit/integration/E2E tests, production builds, dependency audit, migration checks, and Docker-backed infrastructure gates.
   - Only after all gates pass: write `phase-2-report.md`, mark Phase 2 complete and Phase 3 ready, and open a PR to `dev`.

## Source-of-truth resolutions

- Run states follow the authoritative product specification: `ASSIGNED`, `READY`, `IN_PROGRESS`, `SUBMITTED`, `REVIEW_REQUIRED`, `APPROVED`, `CLOSED`, and `CANCELLED`. Earlier placeholder states in the Phase 1 domain package are removed.
- Review is configured per inspection plan. Runs not requiring review follow `SUBMITTED → CLOSED`; configured review runs follow `SUBMITTED → REVIEW_REQUIRED → APPROVED → CLOSED`.
- MVP recurrence remains limited to daily, weekly, monthly, quarterly, and a custom positive day interval. Monthly and quarterly schedules clamp to the last valid local calendar day.
- Phase 2 finding entry stores the minimum inspection-linked observation boundary required by the specification; assignment, corrective action, evidence, verification, and closure remain Phase 3 scope.
