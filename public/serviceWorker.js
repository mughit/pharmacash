const CACHE_NAME = "cashrec-pro-v2";
const SHELL_URLS = ["/", "/index.html", "/favicon.svg", "/manifest.json"];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML → network first, fallback to cache (always fresh)
// - Assets (JS/CSS/fonts) → cache first, fallback to network
// - Everything else → network first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (e.g. AdSense, Google Fonts)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const isHTML = request.headers.get("accept")?.includes("text/html");
  const isAsset = url.pathname.startsWith("/assets/");

  if (isAsset) {
    // Cache first for hashed assets
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
  } else {
    // Network first for HTML and other files
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (isHTML) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
  }
});
