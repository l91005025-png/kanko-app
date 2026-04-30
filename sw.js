// 勤怠管理アプリ用 Service Worker
// HTMLとアイコンのキャッシュ + FCM プッシュ通知の受信
const CACHE = 'kintai-v3';
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
  // 自身のオリジンの静的ファイルのみネットワーク優先＋キャッシュフォールバック
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

// ============================================================
// Firebase Cloud Messaging (バックグラウンドプッシュ通知)
// ============================================================
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCNP-jkL5WRx4IeC6IqkLWsyVo_83RXDEM",
  authDomain: "kintai-app-95b49.firebaseapp.com",
  projectId: "kintai-app-95b49",
  storageBucket: "kintai-app-95b49.firebasestorage.app",
  messagingSenderId: "276856206619",
  appId: "1:276856206619:web:0dab1ee8b413265af64fbe"
});

const messaging = firebase.messaging();

// バックグラウンド受信（アプリが閉じている時）
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || '勤怠管理';
  const body = (payload.notification && payload.notification.body) || '';
  const data = payload.data || {};
  self.registration.showNotification(title, {
    body,
    icon: 'icon.png',
    badge: 'icon.png',
    data,
    tag: data.tag || 'kintai-notif'
  });
});

// 通知クリック時にアプリの該当ページを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './kintai-staff.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const client of wins) {
        if (client.url.includes(targetUrl.replace('./', '')) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
