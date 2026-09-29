# Spatial Queries

Validate bbox, zoom, coordinate ranges, SRID, and geometry validity. Use `ST_Intersects` with indexed envelopes for viewport queries and geography casts for metre distances. Split antimeridian viewports. Return minimal feature fields and cluster at low zoom.

All spatial predicates include organization scope and lifecycle filters. Never transform/index per row inside hot predicates when a normalized stored geometry/index can serve the query. Test empty geometries, poles, antimeridian, duplicate coordinates, invalid polygons, and large dense tenants.
