const CACHE_NAME = 'eraser3d-cache-v1';
const APP_SHELL = [
  './erasermain.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 게임 화면(HTML)은 항상 최신 버전을 먼저 시도하고, 네트워크가 안 되면 캐시로 대체
// (Firebase 로그인/멀티플레이는 온라인이 필요하지만, 앱 자체는 오프라인에서도 열림)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' || req.url.includes('erasermain.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./erasermain.html')))
    );
    return;
  }

  // 그 외 정적 파일(아이콘 등)은 캐시 우선
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
