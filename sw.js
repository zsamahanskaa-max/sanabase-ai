const SANABASE_CACHE = "sanabase-ai-root-pwa-20260708-01";
const APP_SHELL = [
  "./",
  "./index.html",
  "./public/styles.css?v=20260704-06",
  "./public/app.js?v=20260704-06",
  "./public/manifest.json?v=20260708-01",
  "./public/icons/sanabase-icon.svg",
  "./public/js/utils.js?v=20260704-06",
  "./public/js/storage.js?v=20260704-06",
  "./public/js/api.js?v=20260704-06",
  "./public/js/spreadsheet.js?v=20260704-06",
  "./public/js/documents.js?v=20260704-06",
  "./public/js/priceMatching.js?v=20260704-06",
  "./public/js/cloudSync.js?v=20260704-06"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SANABASE_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== SANABASE_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(SANABASE_CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
