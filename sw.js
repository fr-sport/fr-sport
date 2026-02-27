const CACHE_NAME = 'fr-sport-v2';
const urlsToCache = [
  '/fr-sport/',
  '/fr-sport/index.html',
  '/fr-sport/style.css',
  '/fr-sport/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
