"use client";

import { useEffect } from "react";

// Registers /sw.js (public/sw.js), which caches the app shell. Production only:
// a service worker caching dev-server assets gets in the way of hot reloading.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => {
        console.error("Service worker registration failed", error);
      });
  }, []);
  return null;
}
