/* 설호 학습 플래너 서비스 워커: 앱 파일을 저장해 두어 인터넷이 없어도 열린다. */
var V = 'seolho-app-v37';
var FONTS = 'seolho-fonts-v1';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'face.jpg',
  'fonts/Giants-Regular.ttf', 'fonts/Giants-Bold.ttf', 'fonts/Giants-Inline.ttf',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return c.addAll(CORE.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== V && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  /* 구글 글꼴: 한 번 받으면 계속 사용 */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  /* 앱 파일: 저장본을 먼저 보여 주고, 뒤에서 새 버전을 받아 둔다 */
  e.respondWith(caches.open(V).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
