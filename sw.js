// Service worker: เปิดแอปได้แม้ออฟไลน์ และอัปเดตไฟล์อัตโนมัติเมื่อมีเน็ต
const CACHE = 'income-expense-v3';
const FILES = ['./', 'expense-tracker.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'firebase-config.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // จัดการเฉพาะไฟล์ของแอปและตัวไลบรารี Firebase; คำขอไปยัง Google (ล็อกอิน/ฐานข้อมูล) ให้ผ่านตรงๆ
  if (u.pathname.startsWith('/.netlify/')) return;
  if (!(u.origin === location.origin || u.href.startsWith('https://www.gstatic.com/firebasejs/'))) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('expense-tracker.html')))
  );
});
