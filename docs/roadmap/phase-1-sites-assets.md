# Phase 1 — Sites & Assets

## Goal

Establish the tenant-safe spatial asset register and the authentication/organization foundation.

## Status

**IN PROGRESS** — started with the tenant-safe domain and persistence foundation.

## Progress

- [x] Establish organization, membership, invitation, site, asset type, asset, import, and activity-event schema.
- [x] Add UUIDv7, tenant-scoped uniqueness, PostGIS, archive consistency, append-only audit, active-owner, asset-type scope, and hierarchy-cycle constraints.
- [x] Add lifecycle, fixed-role authorization, owner invariant, hierarchy, and import-row domain policies with unit tests.
- [x] Add Docker-backed migration and database-constraint checks to CI.
- [ ] Integrate Better Auth and authentication routes.
- [ ] Implement organization and membership application/API modules.
- [ ] Implement site, asset type, asset, map, search, and import application/API modules.
- [ ] Build authenticated web/PWA screens backed by the real API.
- [ ] Complete Phase 1 integration, E2E, security, accessibility, and load gates.

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

- [ ] User can sign up, verify, sign in, and create an organization.
- [ ] Owner can invite and manage fixed-role members.
- [ ] Authorized users can create/import and archive sites and assets.
- [ ] Assets render through viewport-based map queries.
- [ ] Organization-scoped uniqueness and tenant isolation are enforced and tested.
- [ ] Real API/database data drives all authenticated screens.
