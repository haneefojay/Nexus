# Phase 3 — Findings & Actions

## Goal

Close the inspection-to-verification evidence chain.

## Scope

- Finding severity and state machine
- One MVP corrective action per finding
- Assignment, deadlines, completion evidence, and supervisor verification
- Evidence metadata/storage authorization and provenance
- Immutable activity history
- Email assignments and reminders

## Dependencies

Phase 2 inspections, object storage, worker/Redis, email provider.

## Tests

Finding/action transitions, evidence authorization, signed URLs, completion transactions, verification roles, reminders, and full lifecycle E2E.

## Definition of Done

- [x] Failed observation can become a finding.
- [x] Finding can produce one corrective action.
- [x] Assignee can complete with evidence.
- [x] Authorized reviewer can verify and close.
- [x] Critical findings require verification.
- [x] Complete history is reconstructable and tenant safe.
