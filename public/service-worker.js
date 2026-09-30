// App-shell 快取：讓主功能表在斷線時仍可瀏覽。
// 交易資料一律走網路(交由 offline-queue.js 處理重傳)，不快取 API 回應。
const CACHE_NAME = "oav-shell-v7";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/icons.js",
  "./js/menu-data.js",
  "./js/offline-queue.js",
  "./js/master-maintenance.js",
  "./js/document-maintenance.js",
  "./js/report-viewer.js",
  "./js/report-drilldown.js",
  "./js/app.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // 寫入請求交由前端的 OfflineQueue 處理，不經 SW 快取

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return; // API 一律即時打網路

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
