# Architecture Decision Records

Accepted ADRs lock established decisions so later phases do not repeatedly reopen them. Changing one requires evidence that a revisit condition is met and a superseding ADR.

| ADR                                                | Decision                             | Status   |
| -------------------------------------------------- | ------------------------------------ | -------- |
| [ADR-0001](./ADR-0001-product-boundary.md)         | Product boundary                     | Accepted |
| [ADR-0002](./ADR-0002-modular-monolith.md)         | Modular monolith and worker          | Accepted |
| [ADR-0003](./ADR-0003-postgres-postgis.md)         | PostgreSQL 18 and PostGIS            | Accepted |
| [ADR-0004](./ADR-0004-drizzle.md)                  | Drizzle ORM                          | Accepted |
| [ADR-0005](./ADR-0005-maplibre.md)                 | MapLibre renderer                    | Accepted |
| [ADR-0006](./ADR-0006-map-provider-abstraction.md) | Map provider abstraction             | Accepted |
| [ADR-0007](./ADR-0007-pwa.md)                      | Mobile-first PWA                     | Accepted |
| [ADR-0008](./ADR-0008-offline-sync.md)             | Command-based offline sync           | Accepted |
| [ADR-0009](./ADR-0009-authentication.md)           | First-party session authentication   | Accepted |
| [ADR-0010](./ADR-0010-object-storage.md)           | Private S3-compatible object storage | Accepted |
| [ADR-0011](./ADR-0011-worker-queue.md)             | BullMQ worker and Redis              | Accepted |
| [ADR-0012](./ADR-0012-uuidv7.md)                   | UUIDv7 identifiers                   | Accepted |
| [ADR-0013](./ADR-0013-template-versioning.md)      | Immutable template versions          | Accepted |
| [ADR-0014](./ADR-0014-inspection-immutability.md)  | Submitted inspection immutability    | Accepted |
| [ADR-0015](./ADR-0015-3d-product-boundary.md)      | 3D product boundary                  | Accepted |

Every ADR contains status, context, decision, alternatives, positive/negative consequences, revisit conditions, and references.
