const CACHE = 'lt-v6';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'exam.js', 'data.json', 'grammar.json', 'forms.json', 'manifest.json', 'images/iylt.jpg', 'images/scene.jpg', 'images/icon-192.png', 'images/icon-512.png', 'fonts/literata-latin-wght-normal.woff2', 'fonts/literata-latin-ext-wght-normal.woff2', 'fonts/literata-latin-wght-italic.woff2', 'fonts/literata-latin-ext-wght-italic.woff2', 'fonts/manrope-latin-wght-normal.woff2', 'fonts/manrope-latin-ext-wght-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if(r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
