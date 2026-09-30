/// <reference lib="webworker" />

import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: Array<PrecacheEntry | string> | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/v1/") ||
        url.pathname.includes("/evidence/") ||
        url.searchParams.has("X-Amz-Signature"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        (url.pathname === "/field" || url.pathname.startsWith("/field/")),
      handler: new NetworkFirst({
        cacheName: "nexus-field-shell-v1",
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: ({ request, url }) =>
        url.origin === self.location.origin &&
        ["style", "script", "font", "image"].includes(request.destination),
      handler: new CacheFirst({
        cacheName: "nexus-static-v1",
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
  ],
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

serwist.addEventListeners();
