# Pagination, Filtering, and Sorting

Collections use opaque cursor pagination: `?limit=50&cursor=...`, with a server maximum. Response includes `items` and `pageInfo: { nextCursor, hasNextPage }`. Cursors encode a version and stable sort tuple and are signed/opaque.

Every endpoint defines allowlisted filters and deterministic sorts with UUID tie-breaker. Time comparisons are UTC. Search input is normalized and bounded. Map viewport endpoints are not generic list endpoints: they use bbox/zoom, minimal projections, and clustering/feature limits.
