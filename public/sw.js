/* BuildCare Service Worker – Push Notifications + Offline Cache */
const CACHE_NAME = 'buildcare-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// ─── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ─── Fetch (Network-first, cache fallback) ──────────────────
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('supabase')) return; // never cache API calls

    event.respondWith(
        fetch(event.request)
            .then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});

// ─── Push ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    let data = { title: "BuildCare", body: 'Nueva notificación', icon: '/icon-192.png' };

    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch { /* ignore parse errors */ }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                { action: 'open', title: 'Ver Orden' },
                { action: 'close', title: 'Cerrar' },
            ],
        })
    );
});

// ─── Notification click ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

// ─── Message from app (show notification directly) ──────────
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon } = event.data;
        self.registration.showNotification(title, {
            body,
            icon: icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
        });
    }
});
