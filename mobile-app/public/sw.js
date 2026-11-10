// Financial Suite Mobile PWA Service Worker
const CACHE_NAME = 'financial-suite-v4';

// Install: Immediately activate new worker without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: Purge ALL caches immediately to clear any stale CSS / JS
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('Purging cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Pass through all dev requests directly to network.
// For production, use Network-First with Cache Fallback.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // In dev / localhost or Vite internal requests, bypass SW completely
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '3002' ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@fs') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts')
  ) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
