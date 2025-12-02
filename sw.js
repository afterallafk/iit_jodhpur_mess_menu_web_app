const CACHE_NAME = "iitj-mess-menu-v1";

// List all static assets you want available offline
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./mess-menu-dec-veg.json",       // Veg
  "./mess-menu-dec-nonveg.json",    // Non-Veg
  "./ProductSans-Regular.ttf",
  "./image_web_app/IITJ_COLOURED_192.png",
  "./image_web_app/IITJ_COLOURED_512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  // Clean old caches if you change CACHE_NAME
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Network-first with cache fallback for dynamic requests if needed
      return (
        cached ||
        fetch(event.request).catch(() =>
          // If fetch fails (offline) and not in cache, just return cached index if available
          caches.match("./index.html")
        )
      );
    })
  );
});