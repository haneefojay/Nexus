"use client";

import type { FeatureCollection } from "geojson";
import { Map, NavigationControl, type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { api, ApiClientError } from "@/lib/api";

export function MapView({ organizationId }: { organizationId: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!element.current) return;
    let active = true;
    let request = 0;
    setState("loading");
    setMessage("");
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
      const currentRequest = ++request;
      try {
        const bounds = instance.getBounds();
        const result = await api<{ data: FeatureCollection }>(
          `/v1/map/assets?west=${bounds.getWest()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&north=${bounds.getNorth()}&zoom=${instance.getZoom()}`,
          {},
          organizationId,
        );
        if (!active || currentRequest !== request) return;
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
        setState("ready");
        setMessage("");
      } catch (cause) {
        if (!active || currentRequest !== request) return;
        setState("error");
        setMessage(
          cause instanceof ApiClientError
            ? `${cause.message} (${cause.status}${cause.code ? ` · ${cause.code}` : ""})`
            : "The asset map could not be loaded.",
        );
      }
    };
    instance.on("load", () => void load());
    instance.on("moveend", () => void load());
    map.current = instance;
    return () => {
      active = false;
      instance.remove();
    };
  }, [organizationId]);

  return (
    <div className="operations-map-shell">
      <div aria-label="Asset map" className="operations-map" ref={element} />
      {state !== "ready" && (
        <div aria-live="polite" className={`map-status ${state}`} role="status">
          {state === "loading" ? "Loading network assets…" : message}
        </div>
      )}
    </div>
  );
}
