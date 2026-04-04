const APP_CACHE_NAME = "aoun-v2-app";
const STATIC_CACHE_NAME = "aoun-v2-static";
const OFFLINE_URL = "/offline";
const OFFLINE_READY_PAGES = new Set([
  "/gpa-calculator",
  "/academic-planner",
  "/focus",
]);
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/gpa-calculator",
  "/academic-planner",
  "/focus",
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-72x72.png",
  "/icons/icon-192x192.png",
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isOfflineReadyPage(pathname) {
  return OFFLINE_READY_PAGES.has(pathname);
}

function isStaticAssetRequest(request, url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/sounds/focus/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/icon.svg" ||
    url.pathname.startsWith("/icons/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "audio"
  );
}

async function warmPrecache() {
  const cache = await caches.open(APP_CACHE_NAME);

  await Promise.allSettled(
    PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
  );
}

async function cleanupOldCaches() {
  const activeCaches = new Set([APP_CACHE_NAME, STATIC_CACHE_NAME]);
  const keys = await caches.keys();

  await Promise.all(
    keys
      .filter((key) => !activeCaches.has(key))
      .map((key) => caches.delete(key)),
  );
}

async function putIfOk(cacheName, request, response) {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function matchOfflineReadyPage(cache, request) {
  const requestUrl = new URL(request.url);

  return (
    (await cache.match(request)) ||
    (await cache.match(requestUrl.pathname)) ||
    (await cache.match(OFFLINE_URL))
  );
}

async function handleOfflineReadyRequest(request) {
  const cache = await caches.open(APP_CACHE_NAME);

  try {
    const response = await fetch(request);
    return putIfOk(APP_CACHE_NAME, request, response);
  } catch {
    return (
      (await matchOfflineReadyPage(cache, request)) ||
      new Response("أنت غير متصل بالإنترنت", {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  }
}

async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    return putIfOk(STATIC_CACHE_NAME, request, response);
  } catch {
    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(warmPrecache());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOldCaches());
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (!isSameOrigin(requestUrl)) {
    return;
  }

  if (isOfflineReadyPage(requestUrl.pathname)) {
    event.respondWith(handleOfflineReadyRequest(event.request));
    return;
  }

  if (isStaticAssetRequest(event.request, requestUrl)) {
    event.respondWith(handleStaticAssetRequest(event.request));
    return;
  }

  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ||
          new Response("أنت غير متصل بالإنترنت", {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
      ),
    ),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "عون", body: event.data.text() };
  }

  const { title = "عون", body = "", url = "/" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      dir: "rtl",
      lang: "ar",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
