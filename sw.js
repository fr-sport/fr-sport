const CACHE_NAME = 'fr-sport-cache-v1';
const urlsToCache = [
  '/fr-sport/',
  '/fr-sport/index.html',
  '/fr-sport/Logo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
