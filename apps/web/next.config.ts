import type { NextConfig } from "next";
import path from "node:path";
import withSerwistInit from "@serwist/next";
import { PHASE_PRODUCTION_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
  webpack(config: { resolve: { conditionNames?: string[] } }) {
    // Workspace packages expose TypeScript source under this condition and compiled JS by default.
    config.resolve.conditionNames = ["nexus-source", ...(config.resolve.conditionNames ?? ["..."])];
    return config;
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  reloadOnOnline: false,
  cacheOnNavigation: false,
  disable: process.env.NODE_ENV === "development",
  globPublicPatterns: ["icons/**/*.{svg,png}", "manifest.webmanifest"],
});

const nexusConfig = (phase: string) =>
  phase === PHASE_PRODUCTION_SERVER ? nextConfig : withSerwist(nextConfig);

export default nexusConfig;
