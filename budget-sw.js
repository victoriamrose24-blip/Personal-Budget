// Service worker for offline support. Network-first: while online, always
// fetch the latest version and keep the cache fresh with it; while offline,
// fall back to whatever was last cached, so the app still opens without a
// network connection (all of its actual data already lives in localStorage/
// IndexedDB on-device, so the app just needs its own shell to load).
const CACHE_NAME = 'budget-cache-v1';
const APP_SHELL = [
  './index.html',
  './budget-manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Let cross-origin requests (Google Fonts) pass straight through — this
  // service worker only manages the app's own same-origin shell.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return networkResponse;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
