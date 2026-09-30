import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXUS Field Inspection",
    short_name: "NEXUS Field",
    description: "Secure offline field inspection for assigned NEXUS work.",
    start_url: "/field",
    scope: "/",
    display: "standalone",
    background_color: "#070a09",
    theme_color: "#070a09",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/nexus-field-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/nexus-field-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
