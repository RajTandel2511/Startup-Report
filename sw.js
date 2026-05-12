// Service worker — keeps the form working offline on jobsites.
// Cache-first for app assets, network-first for everything else.

const CACHE = 'aam-startup-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((response) => {
          // Cache same-origin successful responses for offline access next time
          if (response.ok && new URL(req.url).origin === location.origin) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
