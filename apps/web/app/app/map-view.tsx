"use client";

import type { FeatureCollection } from "geojson";
import { Map, NavigationControl, type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { api } from "@/lib/api";

export function MapView({ organizationId }: { organizationId: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!element.current) return;
    const instance = new Map({
      container: element.current,
      center: [3.4, 6.5],
      zoom: 3,
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: "background", type: "background", paint: { "background-color": "#070a09" } },
        ],
      },
      attributionControl: false,
    });
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const load = async () => {
      const bounds = instance.getBounds();
      const result = await api<{ data: FeatureCollection }>(
        `/v1/map/assets?west=${bounds.getWest()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&north=${bounds.getNorth()}&zoom=${instance.getZoom()}`,
        {},
        organizationId,
      );
      const source = instance.getSource("assets") as GeoJSONSource | undefined;
      if (source) source.setData(result.data);
      else {
        instance.addSource("assets", {
          type: "geojson",
          data: result.data,
          cluster: true,
          clusterRadius: 48,
        });
        instance.addLayer({
          id: "asset-clusters",
          type: "circle",
          source: "assets",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#b9f227",
            "circle-radius": ["step", ["get", "point_count"], 16, 100, 24, 750, 34],
            "circle-opacity": 0.82,
          },
        });
        instance.addLayer({
          id: "assets",
          type: "circle",
          source: "assets",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "condition"],
              "CRITICAL",
              "#ff6b57",
              "ATTENTION",
              "#f5a742",
              "#b9f227",
            ],
            "circle-radius": 7,
            "circle-stroke-color": "#070a09",
            "circle-stroke-width": 2,
          },
        });
      }
    };
    instance.on("load", () => void load());
    instance.on("moveend", () => void load());
    map.current = instance;
    return () => instance.remove();
  }, [organizationId]);

  return <div aria-label="Asset map" className="operations-map" ref={element} />;
}
