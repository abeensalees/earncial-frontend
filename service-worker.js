// ═══════════════════════════════════════════════════════
// Earncial Service Worker v4
// ✅ Auto-caches EVERY page the user visits
// ✅ No need to edit any page — works site-wide automatically
// ✅ Shows offline.html when internet is lost on ANY page
// ✅ Bump CACHE_NAME (e.g. earncial-v5) when you deploy updates
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'earncial-v4';
const OFFLINE_URL = '/offline.html';

// Critical files cached immediately on install
// These MUST be cached so offline page always works
const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/manifest.json',
  '/logo.png',
  // Key pages — cached on install for instant load
  '/sign-up.html',
  '/sign-in.html',
  '/faq.html',
];

// ── INSTALL ───────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache each file individually — one failure won't break everything
      return Promise.allSettled(
        PRECACHE.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Could not cache:', url, err);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting(); // Take over immediately
    })
  );
});

// ── ACTIVATE ──────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      // ✅ THIS is the key — claim ALL open tabs/pages immediately
      // So every page on the site is protected without any code on them
      return self.clients.claim();
    })
  );
});

// ── FETCH ─────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Only handle GET, same-origin, http/https requests
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;
  if (!req.url.startsWith('http')) return;

  // ── HTML page navigation (ANY page on the site) ──
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function(response) {
          // ✅ Auto-cache every page the user visits
          // So next time they visit, it loads from cache even offline
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(req, clone);
            });
          }
          return response;
        })
        .catch(function() {
          // No internet — check if we have this page cached
          return caches.match(req).then(function(cachedPage) {
            if (cachedPage) {
              // Great — serve the cached version of this exact page
              return cachedPage;
            }
            // Page not in cache — serve offline.html
            return caches.match(OFFLINE_URL).then(function(offlinePage) {
              return offlinePage || new Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>You\'re Offline</h1><p>Please check your internet connection.</p><button onclick="location.reload()">Try Again</button></body></html>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            });
          });
        })
    );
    return;
  }

  // ── Static assets (images, CSS, JS, fonts) ──
  // Cache-first: serve from cache instantly, update in background
  event.respondWith(
    caches.match(req).then(function(cached) {
      var networkFetch = fetch(req).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached; // Offline fallback for assets
      });
      return cached || networkFetch;
    })
  );
});

// ── MESSAGE ───────────────────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── PUSH NOTIFICATIONS ────────────────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    var data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Earncial', {
        body: data.body || 'You have a new update.',
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: data.url || '/' }
      })
    );
  } catch(e) {}
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
