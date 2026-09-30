# Phase 1 — Sites & Assets

## Goal

Establish the tenant-safe spatial asset register and the authentication/organization foundation.

## Status

**COMPLETE** — the authenticated, tenant-safe spatial asset register and operational application slice are implemented and validated.

## Progress

- [x] Establish organization, membership, invitation, site, asset type, asset, import, and activity-event schema.
- [x] Add UUIDv7, tenant-scoped uniqueness, PostGIS, archive consistency, append-only audit, active-owner, asset-type scope, and hierarchy-cycle constraints.
- [x] Add lifecycle, fixed-role authorization, owner invariant, hierarchy, and import-row domain policies with unit tests.
- [x] Add Docker-backed migration and database-constraint checks to CI.
- [x] Integrate Better Auth routes with verified email/password, Argon2id, revocable database sessions, reset flow, database-backed throttling, and queued email delivery.
- [x] Add authenticated, atomic organization creation with owner membership and immutable audit history.
- [x] Implement invitation and membership-management application/API modules.
- [x] Implement site, asset type, asset, map, search, and import application/API modules.
- [x] Build authenticated web/PWA screens backed by the real API.
- [x] Complete Phase 1 integration, E2E, security, accessibility, and performance gates.

## Scope

- Better Auth integration, sessions, verification, reset
- Organizations, memberships, invitations, and fixed roles
- Sites, asset types, assets, and acyclic parent relationships
- Archive/deactivate lifecycle
- MapLibre map foundation and MapTiler provider abstraction
- CSV site/asset import with preview, validation, and row errors
- Basic activity events and search

## Dependencies

Completed Phase 0, PostgreSQL/PostGIS, storage/config foundations, API and web shells.

## Tests

- Unit: lifecycle, hierarchy cycle detection, import validation, authorization
- Integration: PostGIS, tenant scope, auth, database constraints
- E2E: organization, invitation, site/asset CRUD, import, archive, map
- Security: cross-tenant and role access

## Risks

Tenant leaks, invalid spatial data, hierarchy cycles, large map payloads, partial imports.

## Definition of Done

- [x] User can sign up, verify, sign in, and create an organization.
- [x] Owner can invite and manage fixed-role members.
- [x] Authorized users can create/import and archive sites and assets.
- [x] Assets render through viewport-based map queries.
- [x] Organization-scoped uniqueness and tenant isolation are enforced and tested.
- [x] Real API/database data drives all authenticated screens.
