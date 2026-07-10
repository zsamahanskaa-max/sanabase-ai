const SANABASE_CACHE = "sanabase-ai-root-pwa-20260710-04";
const APP_SHELL = [
  "./",
  "./index.html",
  "./public/styles.css?v=20260710-04",
  "./public/app.js?v=20260710-04",
  "./public/manifest.json?v=20260710-04",
  "./public/icons/sanabase-icon.svg",
  "./public/js/utils.js?v=20260710-04",
  "./public/js/storage.js?v=20260710-04",
  "./public/js/api.js?v=20260710-04",
  "./public/js/spreadsheet.js?v=20260710-04",
  "./public/js/documents.js?v=20260710-04",
  "./public/js/priceMatching.js?v=20260710-04",
  "./public/js/cloudSync.js?v=20260710-04"
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
