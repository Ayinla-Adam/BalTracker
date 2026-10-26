const CACHE_NAME = "baltracker-shell-v17";
const APP_SHELL = [
  "./",
  "./index.html",
  "./main.html",
  "./customer.html",
  "./guest.html",
  "./supabase-client.js",
  "./pwa.js",
  "./language.js",
  "./manifest.json",
  "./balTracker-logo.png",
  "./BalTracker-logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("baltracker-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      // Prefer the app shell cache for instant navigation, especially when the
      // device is offline or the connection is present but unusably slow.
      const path = url.pathname;
      let cachedPage = await caches.match(request);
      if (!cachedPage) {
        if (path.endsWith("/main.html")) cachedPage = await caches.match("./main.html");
        else if (path.endsWith("/customer.html")) cachedPage = await caches.match("./customer.html");
        else if (path.endsWith("/guest.html")) cachedPage = await caches.match("./guest.html");
        else if (path.endsWith("/index.html") || path.endsWith("/")) {
          cachedPage = await caches.match("./index.html") || await caches.match("./");
        }
      }

      if (cachedPage) {
        // Refresh the cached navigation in the background for the next visit.
        fetch(request).then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
        }).catch(() => {});
        return cachedPage;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        const fallback = await caches.match("./index.html");
        if (fallback) return fallback;
        return new Response("BalTracker is offline. Reconnect to the internet and try again.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  const shellPath = url.pathname.split("/").pop();
  const cacheableFiles = new Set([
    "index.html", "main.html", "customer.html", "guest.html", "supabase-client.js", "pwa.js", "language.js",
    "manifest.json", "balTracker-logo.png", "BalTracker-logo.svg"
  ]);
  if (!cacheableFiles.has(shellPath)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      return new Response("", { status: 503, statusText: "Offline" });
    }
  })());
});
