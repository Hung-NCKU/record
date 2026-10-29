/*
 * 離線快取：在沒有網路的地方（健身房地下室、山上）也打得開。
 * 改了任何檔案就把 VERSION 加一，手機下次連網時會換成新版。
 */
const VERSION = 'fit-record-v4';
const FILES = [
  './', 'index.html', 'style.css', 'app.js', 'data.js', 'manifest.webmanifest',
  'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' 跳過瀏覽器快取：GitHub Pages 讓檔案快取 10 分鐘，
  // 不跳過的話剛推上去的新版會裝進舊檔案
  event.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 先給快取（訊號差時不用等網路逾時），同時在背景抓新版，下次開啟就是新的
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((cached) => {
    // 用網址重抓：開頁面的請求（mode: navigate）不能帶 init 再包一次，會直接丟錯
    const fresh = fetch(event.request.url, { cache: 'no-cache' }).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(event.request, copy));
      }
      return res;
    });
    if (cached) { event.waitUntil(fresh.catch(() => {})); return cached; }
    return fresh.catch(() => caches.match('index.html'));
  }));
});
