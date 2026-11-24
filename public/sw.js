// Little Nook service worker. Registered by
// src/components/pwa/service-worker-registration.tsx.
//
// It caches the app shell only: the offline page with its scripts, styles and
// fonts, and the build's static assets. Little Nook is
// online-only, so page HTML and data requests always go to the network and are
// never cached, and non-GET requests (writes) are left alone: they fail
// normally when offline and are never queued or replayed.
//
// Bump VERSION when the offline page changes (the worker script is otherwise
// byte-identical across deploys, so browsers keep the old one); activating
// the new worker drops the old caches.

const VERSION = "v1";
const SHELL_CACHE = `little-nook-shell-${VERSION}`;
const ASSET_CACHE = `little-nook-assets-${VERSION}`;
const MAX_ASSET_ENTRIES = 150;

const OFFLINE_URL = "/offline";

// Build assets referenced by a page's HTML (script src, stylesheet and font
// preload hrefs). Stops at characters that end a URL in HTML or in the inline
// RSC payload.
const STATIC_ASSET_PATTERN = /\/_next\/static\/[^"'\s\\<>&)]+/g;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      const offlinePage = await cache.match(OFFLINE_URL);
      const html = offlinePage ? await offlinePage.text() : "";
      const assets = new Set(html.match(STATIC_ASSET_PATTERN) ?? []);
      await cache.addAll([...assets]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = new Set([SHELL_CACHE, ASSET_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith("little-nook-") && !current.has(name),
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkWithOfflineFallback(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    throw error;
  }
}

// Build assets have content-hashed URLs, so a cached copy never goes stale.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_ASSET_ENTRIES);
  }
  return response;
}

// Keeps the runtime cache from growing across deploys: drops the oldest
// entries (cache keys are in insertion order).
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - maxEntries))
      .map((key) => cache.delete(key)),
  );
}
