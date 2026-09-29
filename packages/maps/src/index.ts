export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface GeocodingResult {
  label: string;
  longitude: number;
  latitude: number;
  providerId: string;
}

export interface MapProvider {
  getStyleUrl(style: "operational" | "satellite"): string;
}

export interface GeocodingProvider {
  search(query: string, limit: number): Promise<GeocodingResult[]>;
}
