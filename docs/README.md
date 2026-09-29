# NEXUS Engineering Handbook

## Start here

1. `../AGENTS.md` — mandatory agent and contributor rules.
2. `source/NEXUS-product-specification-and-phase-0-directive.md` — highest product authority.
3. `roadmap/roadmap.md` — current phase and implementation sequence.
4. `product/` — product decisions, requirements, domain rules, and scope.
5. `architecture/` — implementation architecture and component responsibilities.
6. `decisions/` — accepted architecture decision records.
7. `api/` — API-wide conventions; generated OpenAPI later owns endpoint-level truth.
8. `database/` — migration, schema, indexing, and spatial-query rules.
9. `security/` — threat model, tenant isolation, file security, and incidents.
10. `traceability/` — requirement-to-phase and requirement-to-test mappings.
11. `development/` — setup, workflow, skills, testing, and release guidance.

## Source-of-truth map

| Information             | Source of truth                      |
| ----------------------- | ------------------------------------ |
| Product scope           | `product/scope.md`                   |
| Functional requirements | `product/functional-requirements.md` |
| Domain invariants       | `product/domain-rules.md`            |
| Architecture            | `architecture/overview.md`           |
| Technology decisions    | `decisions/`                         |
| Current phase           | `roadmap/roadmap.md`                 |
| API endpoints           | Generated OpenAPI contract           |
| API-wide behavior       | `api/`                               |
| Database schema         | Versioned migrations                 |
| Agent behavior          | `../AGENTS.md`                       |
| Project history         | `../CHANGELOG.md`                    |

If documentation conflicts, use the hierarchy in `AGENTS.md` and correct the lower-precedence source.
