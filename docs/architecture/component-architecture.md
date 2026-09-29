# Component Architecture

Components are grouped by domain ownership rather than technical CRUD layers.

## Responsibility matrix

| Component          | Owns                                                         | Must not own                                              |
| ------------------ | ------------------------------------------------------------ | --------------------------------------------------------- |
| Web/PWA            | Rendering, interaction, local field cache/queue              | Authorization truth, final transitions                    |
| API/Auth           | Sessions, identity, membership context                       | Domain-specific lifecycle policy                          |
| API domain modules | Commands, queries, transitions, transactions                 | Provider SDK leakage                                      |
| Worker             | Scheduled/retryable imports, reports, notifications, cleanup | Interactive authorization decisions without fresh context |
| Database package   | Schema, migrations, connection primitives                    | UI types                                                  |
| Contracts          | API envelopes/versioned DTO primitives                       | Persistence implementation                                |
| Storage/Maps ports | Provider-neutral interfaces                                  | Domain state                                              |

## Modules

Auth, organizations, members, sites, assets, maps/search/imports, inspection templates/plans/runs, findings, corrective actions, evidence, offline sync, notifications, reports, and audit. Modules expose application services, not tables.
