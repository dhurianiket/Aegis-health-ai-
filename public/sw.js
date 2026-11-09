/**
 * Aegis Health AI — Progressive Web App Service Worker
 * Ensures fast asset caching, offline resiliency, and standalone PWA compliance.
 */

const CACHE_NAME = 'aegis-health-ai-v3';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache partial notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only intercept same-origin HTTP/HTTPS requests (never chrome-extension, fonts CDN, analytics)
  if (url.origin !== self.location.origin || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Never intercept non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // 3. Never intercept Firebase reserved paths (/__/*), Auth handlers, or Cloudflare Edge API (/api/*)
  if (
    url.pathname.startsWith('/__/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/auth/')
  ) {
    return;
  }

  // 4. For navigation requests (HTML pages), use Network-first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          try {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;
            const fallback = await caches.match('/');
            return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          } catch {
            return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          }
        })
    );
    return;
  }

  // 5. For static assets (images, scripts, css), use Stale-While-Revalidate with safe abort catches
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background safely without throwing on network disconnect
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
              }
            })
            .catch(() => {
              // Background revalidation notice caught safely
            });
          return cachedResponse;
        }

        // Not in cache: fetch from network and catch aborted/canceled requests safely
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // Return match if available, or a benign empty response for aborted fetches (prevents 80+ console errors)
            return caches.match(request).then((cached) => {
              if (cached) return cached;
              return new Response('', { status: 408, statusText: 'Request Aborted' });
            }).catch(() => {
              return new Response('', { status: 408, statusText: 'Request Aborted' });
            });
          });
      })
      .catch(() => {
        return new Response('', { status: 408, statusText: 'Cache match error' });
      })
  );
});
