const CACHE_NAME = "bp-guardian-v2";

const STATIC_ASSETS = [
  "/static/css/styles.css",

  "/static/js/api.js",
  "/static/js/dashboard.js",
  "/static/js/badges.js",
  "/static/js/log.js",
  "/static/js/insights.js",
  "/static/js/ui.js",
  "/static/js/auth.js",
  "/static/js/offline-status.js",
  "/static/js/offline-storage.js",
  "/static/js/sync.js",

  "/static/images/welcome-bg.jpg"
];

const HTML_PAGES = [
  "/dashboard",
  "/log",
  "/insights",
  "/badges"
];

// INSTALL - Cache static assets and pre-load HTML pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache static assets 
      cache.addAll(STATIC_ASSETS);
      
      // Try to cache HTML pages, but don't fail if some don't cache
      HTML_PAGES.forEach(page => {
        fetch(page)
          .then(response => {
            if (response && response.status === 200) {
              cache.put(page, response.clone());
            }
          })
          .catch(err => console.log("Could not cache page:", page, err));
      });
      
      // Always complete installation
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

// ACTIVATE (cleanup old caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH (improved strategy for better offline navigation in Chrome)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const { request } = event;

  // For navigation requests (page loads), try network first then cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses for future offline use
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to find in cache
          return caches.match(request)
            .then(cached => {
              if (cached) return cached;
              
              // If the specific page isn't cached, return dashboard as fallback
              return caches.match("/dashboard")
                .catch(() => {
                  console.log("Offline: No cached page available");
                  // Return a simple offline page
                  return new Response(
                    "<h1>Offline</h1><p>This page is not available offline. Please check your connection or visit a page you've previously accessed.</p>",
                    { headers: { "Content-Type": "text/html" } }
                  );
                });
            });
        })
    );
    return;
  }

  // For other GET requests (assets, API calls), use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(err => {
            console.log("Offline - not in cache:", request.url);
            return null;
          });
      })
  );
});
