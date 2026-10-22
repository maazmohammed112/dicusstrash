const CACHE_PREFIX = 'discuss-stash-';
const CACHE_NAME = 'discuss-stash-v3';
const SHELL = ['/', '/index.html', '/404.html', '/manifest.json', '/bootstrap.js', '/icon-192.svg', '/icon-512.svg', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifest = await fetch('/asset-manifest.json', { cache: 'no-store' });
    if (!manifest.ok) throw new Error('Offline asset manifest is unavailable.');
    const assets = await manifest.json();
    await cache.addAll([...SHELL, ...assets]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || ['localhost', '127.0.0.1'].includes(url.hostname)) return;
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    const known = ['/', '/index.html', '/share-target', '/share-target/'].includes(url.pathname);
    event.respondWith((async () => {
      if (!known) {
        const page = await caches.match('/404.html');
        return new Response(page ? await page.text() : 'Page not found', { status: 404, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
      }
      try {
        const response = await fetch(event.request);
        if (response.ok) return response;
      } catch { /* Installed shell remains available offline. */ }
      return (await caches.match('/index.html')) || new Response('Open the app online once to enable offline access.', { status: 503 });
    })());
    return;
  }
  if (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname)) {
    event.respondWith((async () => {
      // Hashed bundles are immutable. Mutable shell files use the network first.
      if (url.pathname.startsWith('/assets/')) {
        const cached = await caches.match(event.request); if (cached) return cached;
      }
      try {
        const response = await fetch(event.request);
        if (response.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(event.request, response.clone()); }
        return response;
      } catch { return (await caches.match(event.request)) || new Response('Offline asset unavailable', { status: 503 }); }
    })());
  }
});
