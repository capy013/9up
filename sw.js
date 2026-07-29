/* 9UP service worker — caches the app so it works fully offline once installed.
   Bump CACHE_VERSION whenever index.html or assets change, so users get the update. */
const CACHE_VERSION = 'v1';
const CACHE_NAME = '9up-' + CACHE_VERSION;

// core files that make the app run offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './data/questions.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg'
];

// install: pre-cache the core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch: cache-first for same-origin GET requests (offline-friendly),
// falling back to network, then updating the cache in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        // only cache good same-origin responses
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached); // offline → serve cache if we have it

      // serve cache immediately when available, otherwise wait for network
      return cached || network;
    })
  );
});
