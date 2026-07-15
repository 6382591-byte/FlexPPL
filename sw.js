const CACHE = "vektr-v13-major-stabilization";
const ASSETS = [
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/assets/icons/icon-monochrome.svg",
  "/assets/icons/icon-foreground.svg",
  "/assets/icons/icon-192.svg",
  "/assets/icons/icon-512.svg",
  "/assets/icons/icon-maskable-512.svg",
  "/js/exercises.js",
  "/js/illustrations.js",
  "/js/replacements.js",
  "/js/plate-calculator.js",
  "/js/progression.js",
  "/js/progress.js",
  "/js/programs.js",
  "/js/state.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    // Populate entries one at a time. Cache.addAll() rejects the entire
    // install when two URLs normalize to the same cache key in Chromium.
    for (const asset of ASSETS) {
      try {
        await cache.delete(asset);
        await cache.add(new Request(asset, { cache: "reload" }));
      } catch (error) {
        throw new Error(`Unable to cache ${asset}: ${error?.message || error}`);
      }
    }
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    })),
  );
});
