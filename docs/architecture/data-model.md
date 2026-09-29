# Data Model

The relational model preserves organization ownership, immutable operational history, and spatial querying.

## Aggregate map

User and Session are global identity records. Organization owns Membership, Site, AssetType, Asset, Template/Version, Plan, Run/Response, Finding, CorrectiveAction, Evidence, Import, Report, Notification, and ActivityEvent. All tenant-owned relations include organization identity even when derivable, with consistency constraints.

## Spatial types

Sites may have point and polygon geometry; assets have point geometry initially. Geometry uses SRID 4326. Geography casts are used for distance in metres; GIST indexes support viewport and proximity queries.

## Integrity

UUIDv7 primary keys, UTC timestamps, normalized unique keys scoped to organization, explicit status checks/enums, foreign keys, cycle prevention in the domain plus database safeguards where practical, and partial indexes for active/attention queues.

## Immutability

Published template versions, submitted inspection records, evidence provenance, activity events, and report snapshots are append-only or mutation-restricted.
