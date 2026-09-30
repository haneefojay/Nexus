"use client";

import { useEffect, useState } from "react";

import { hasUnsynchronizedWork } from "@/lib/field-db";

export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production" ||
      !window.location.pathname.startsWith("/field")
    )
      return;
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) setWaiting(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller)
            setWaiting(worker);
        });
      });
    });
    const changed = () => {
      if (sessionStorage.getItem("nexus-pwa-update-approved") !== "true") return;
      sessionStorage.removeItem("nexus-pwa-update-approved");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", changed);
  }, []);

  async function update() {
    if (!waiting) return;
    if (await hasUnsynchronizedWork()) {
      setBlocked(true);
      return;
    }
    sessionStorage.setItem("nexus-pwa-update-approved", "true");
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if (!waiting) return null;
  return (
    <aside aria-live="polite" className="pwa-update">
      <strong>Field app update ready</strong>
      <p>
        {blocked
          ? "Synchronize or save a recovery record before reloading. Pending device work was not removed."
          : "Reload when no field work is waiting for server confirmation."}
      </p>
      <button onClick={() => void update()}>Safely reload</button>
    </aside>
  );
}
