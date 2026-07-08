const SANABASE_CACHE = "sanabase-ai-pwa-20260708-01";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260704-06",
  "./app.js?v=20260704-06",
  "./manifest.json?v=20260708-01",
  "./icons/sanabase-icon.svg",
  "./js/utils.js?v=20260704-06",
  "./js/storage.js?v=20260704-06",
  "./js/api.js?v=20260704-06",
  "./js/spreadsheet.js?v=20260704-06",
  "./js/documents.js?v=20260704-06",
  "./js/priceMatching.js?v=20260704-06",
  "./js/cloudSync.js?v=20260704-06"
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
