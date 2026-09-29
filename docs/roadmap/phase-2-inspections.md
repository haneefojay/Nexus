# Phase 2 — Inspections

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

- [ ] Manager can publish a template and create a recurring plan.
- [ ] Worker creates controlled upcoming runs without materializing an unbounded future.
- [ ] Technician can complete and submit an inspection online.
- [ ] Submitted responses are immutable.
- [ ] Due, overdue, coverage, and attention calculations are deterministic and tested.
