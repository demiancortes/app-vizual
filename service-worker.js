const CACHE_NAME = "cotizador-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/styles.css",
  "./assets/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
