const CACHE_NAME = 'start-rescue-cache-v2'; // Increased version to force update
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './patient.js',
    './vitals.js',
    './gcs.js',
    './notes.js',
    './cpr.js',
    './results.js',
    './manifest.json',
    // External dependencies
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    // Add any image files (like icon-512.png) here
    './icon-512.png' 
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request).catch(error => {
          // Fallback response for specific URLs if network fails
          if (event.request.url.includes('chart.umd.min.js')) {
            // Can't return a chart here, so just let it fail or return a simple error
            console.error("Chart.js failed to load from network and cache.");
          }
          throw error;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately after activation
  );
});

// Listener to force the service worker to immediately activate upon receiving an update message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
