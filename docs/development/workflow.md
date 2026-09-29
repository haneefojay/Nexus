# Development Workflow

## Before coding

Confirm current phase, requirement IDs, owning ADRs/domain rules, acceptance tests, tenant/security impact, and smallest vertical slice. Load only relevant skills. Do not implement future-phase features.

## During coding

Keep domain policy out of UI/controllers, make tenant scope explicit, add migration/contracts/tests together, preserve idempotency and audit, and record material debt with owner/exit condition.

## Before completion

Run format check, lint, typecheck, tests, build, migrations/infrastructure checks, dependency audit, and relevant smoke/E2E/security/accessibility tests. Update requirements/traceability, roadmap checklist, changelog, and docs in the same change.
