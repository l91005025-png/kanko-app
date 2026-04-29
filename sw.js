// 勤怠管理アプリ用 Service Worker
// HTMLとアイコンのみキャッシュ。Firebase等のAPI呼び出しは常にネットワーク経由。
const CACHE = 'kintai-v2';
const APP_SHELL = [
  './kintai.html',
  './kintai-staff.html',
  './icon.png',
  './manifest.json',
  './manifest-staff.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 自身のオリジンのHTMLのみネットワーク優先＋キャッシュフォールバック
  if (url.origin === self.location.origin &&
      (url.pathname.endsWith('.html') || url.pathname.endsWith('.png') ||
       url.pathname.endsWith('.json') || url.pathname.endsWith('/'))) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
