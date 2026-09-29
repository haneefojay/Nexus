# Mobile Strategy

## Decision

NEXUS uses a mobile-first PWA for MVP field execution. It does not ship a native mobile application.

## Offline scope

Previously synchronized assigned inspections can be opened and completed offline, including responses, notes, findings, and local evidence capture. Administration, imports, reporting, master-data editing, and analytics remain online-only.

## Technical model

- Serwist or an equivalent maintained service-worker solution
- Dexie/IndexedDB for assignments, templates, responses, mutation queue, and photo blobs
- ordered, idempotent commands
- one active executor/device per inspection run
- visible connection and synchronization states

## UX priorities

1. Assigned inspections
2. Start or resume
3. Checklist progress
4. Camera and evidence
5. Findings
6. Review and submit
7. Synchronization state

Large touch targets, minimal typing, and explicit local/server state are mandatory.

## Native revisit conditions

Consider native mobile only if customer evidence demonstrates browser limitations involving prolonged offline use, advanced hardware access, background location, device integrations, or reliable background synchronization.
