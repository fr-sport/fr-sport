const CACHE_NAME = 'fr-sport-cache-v2';
const urlsToCache = [
  '/fr-sport/',
  '/fr-sport/index.html',
  '/fr-sport/manifest.json',
  '/fr-sport/android-chrome-192x192.png',
  '/fr-sport/android-chrome-512x512.png',
  '/fr-sport/apple-touch-icon.png'
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

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
