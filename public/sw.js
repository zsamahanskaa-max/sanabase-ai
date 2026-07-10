const SANABASE_CACHE = "sanabase-ai-pwa-20260710-15";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260710-15",
  "./app.js?v=20260710-15",
  "./manifest.json?v=20260710-15",
  "./business/index.html?v=20260710-15",
  "./icons/sanabase-icon.svg",
  "./js/utils.js?v=20260710-15",
  "./js/storage.js?v=20260710-15",
  "./js/api.js?v=20260710-15",
  "./js/spreadsheet.js?v=20260710-15",
  "./js/documents.js?v=20260710-15",
  "./js/priceMatching.js?v=20260710-15",
  "./js/cloudSync.js?v=20260710-15"
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

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(SANABASE_CACHE).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(SANABASE_CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
