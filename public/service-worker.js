/*
 * share-ui：替换 Cloudreve 3.8.3 自带的 Workbox Service Worker（原文件见 upstream/service-worker.js）。
 *
 * 原 SW 从 Google CDN 加载 workbox，并把 index.html 预缓存后对页面导航「缓存优先」返回，
 * 会让装过它的老访客一直拿到旧的 index.html，看不到新的分享页。原版前端每次加载仍会注册
 * /service-worker.js，所以这里保留同名文件：不拦截任何请求，安装后立即接管并删除 workbox 旧缓存。
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('workbox-')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
