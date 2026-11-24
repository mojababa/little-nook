"use client";

import { useEffect } from "react";

// Registers /sw.js (public/sw.js), which caches the app shell. The build
// version in the script URL makes each deploy install a new worker with fresh
// caches, even though the script itself doesn't change. Production only: a
// service worker caching dev-server assets gets in the way of hot reloading.
const scriptUrl = `/sw.js?v=${encodeURIComponent(
  process.env.NEXT_PUBLIC_BUILD_VERSION ?? "local",
)}`;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(scriptUrl, { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => {
        console.error("Service worker registration failed", error);
      });
  }, []);
  return null;
}
