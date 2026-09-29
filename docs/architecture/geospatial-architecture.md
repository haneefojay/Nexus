# Geospatial Architecture

Spatial context is operational, not decorative.

## Storage

PostGIS geometry in SRID 4326; validate longitude/latitude and polygon validity on write. Preserve original normalized address separately from provider identifiers.

## Query pattern

Viewport endpoint accepts validated bbox, zoom, and bounded filters. It uses GIST indexes and minimal feature projections. Low zoom returns clusters/aggregates; details are fetched on selection. Antimeridian boxes are split.

## Rendering

MapLibre renders vector/WebGL layers; avoid one DOM marker per asset. Provider adapters supply tiles/geocoding without contaminating domain records. Cache only under provider terms and expose attribution.

## Performance

Measure row scans, query latency, payload size, render time, and interaction responsiveness. Load-test realistic tenant distributions before widening limits.
