const CACHE_NAME = 'guest-ai-cache-v1';
const URLS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/index.tsx', // The browser resolves this via import map; caching it ensures the entry module is available.
  '/manifest.json',
  '/icons/icon-192x192.png', // User needs to provide this
  '/icons/icon-maskable-192x192.png', // User needs to provide this
  '/icons/icon-512x512.png', // User needs to provide this
  '/icons/icon-maskable-512x512.png' // User needs to provide this
];

// URLs for runtime caching (these will be cached on first fetch)
const RUNTIME_CACHE_HOSTNAMES = [
  'esm.sh',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_PRECACHE);
      })
      .catch(err => {
        console.error('Failed to cache all initial assets:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                 .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    // Don't cache non-GET requests (e.g., API calls to Gemini)
    return;
  }

  const requestUrl = new URL(event.request.url);

  // For local assets and predefined precache URLs, use Cache First strategy
  if (requestUrl.origin === self.location.origin || URLS_TO_PRECACHE.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
        .catch(error => {
          console.error('Error in fetch handler for local/precache assets:', error);
          // Optionally, return a generic offline page here for navigation requests
          // if (event.request.mode === 'navigate') {
          //   return caches.match('/offline.html');
          // }
        })
    );
    return;
  }

  // For known CDN assets, use Stale-While-Revalidate strategy
  if (RUNTIME_CACHE_HOSTNAMES.includes(requestUrl.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
            console.warn('Fetch failed; returning cached response if available.', requestUrl.href, error);
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // For all other requests, just fetch from network
  // event.respondWith(fetch(event.request));
});