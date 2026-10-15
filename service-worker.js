const CACHE_NAME = "baltracker-shell-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./main.html",
  "./supabase-client.js",
  "./pwa.js",
  "./manifest.json",
  "./balTracker-logo.png",
  "./baltracker-app-icon.svg",
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
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        const cachedPage = await caches.match(request);
        if (cachedPage) return cachedPage;

        const path = url.pathname;
        if (path.endsWith("/main.html")) {
          const cachedMain = await caches.match("./main.html");
          if (cachedMain) return cachedMain;
        }
        const cachedIndex = await caches.match("./index.html");
        if (cachedIndex) return cachedIndex;
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
    "index.html", "main.html", "supabase-client.js", "pwa.js",
    "manifest.json", "balTracker-logo.png", "baltracker-app-icon.svg"
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
