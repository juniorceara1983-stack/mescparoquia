const CACHE_NAME = "mesc-v2";
const ASSETS = ["./Mesc.html", "./Ministro.html", "./config.js", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

// OUVIR NOTIFICAÇÕES AGENDADAS
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// ESCUTAR MENSAGENS DO APP (PARA O BADGE)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_BADGE') {
    if (navigator.setAppBadge) navigator.setAppBadge(event.data.count);
  }
});
