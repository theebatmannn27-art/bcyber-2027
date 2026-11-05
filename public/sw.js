// Minimal service worker: offline shell + notification display.
const CACHE = 'bcyber-v2';
const SHELL = ['/', '/checklist', '/manifest.webmanifest', '/icon-192.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Never cache page HTML: the app is private, and a cached dashboard could be
// opened from disk on a locked device. Only static assets are cached.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.url.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<body style="background:#05070d;color:#94a3b8;font-family:system-ui;display:flex;' +
              'align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">' +
              '<div><p style="font-size:15px;color:#e2e8f0">You are offline</p>' +
              '<p style="font-size:12px;margin-top:6px">Reconnect to open the tracker.</p></div></body>',
            { headers: { 'content-type': 'text/html' }, status: 200 }
          )
      )
    );
    return;
  }

  const cacheable = ['script', 'style', 'image', 'font'].includes(request.destination);
  if (!cacheable) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || Response.error()))
  );
});

// Page asks the worker to display a notification (so it still shows when the tab is hidden).
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'notify') {
    self.registration.showNotification(data.title || 'B.Cyber 2027', {
      body: data.body || '',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: data.tag || 'bcyber-daily',
      renotify: true,
      data: { url: data.url || '/' },
    });
  }
});

// Real Web Push (only used if you later add VAPID keys server-side).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title || 'B.Cyber 2027', {
      body: payload.body || "Check today's targets.",
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
