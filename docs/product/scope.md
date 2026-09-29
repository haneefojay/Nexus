# Product Scope

## MVP boundary

NEXUS owns:

- authentication, organizations, memberships, and fixed MVP roles;
- sites, asset types, assets, hierarchy, and spatial location;
- CSV import for sites and assets;
- versioned inspection templates, plans, runs, and assignments;
- guided inspection execution on desktop and mobile;
- offline field inspection through a PWA;
- findings and one corrective action per finding in MVP;
- evidence provenance, authorized storage, completion, and verification;
- inspection reports and CSV exports;
- operational map, attention view, inspection coverage, and activity history;
- email notifications, audit events, worker jobs, and observability.

## Product boundaries

- Corrective actions exist to close findings; they are not general work orders.
- Offline access covers field execution, not the entire product.
- Spatial operations use 2D maps in the MVP.
- The authenticated product is backed by real server data.
- Distributed power is the initial UX and demo context; the core model remains industry-neutral.

## Change rule

Scope changes require updates to the authoritative requirements, roadmap, tests, and—when architectural—an ADR before implementation.
