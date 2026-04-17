const CACHE_NAME = "mesc-ministro-v3"; // Nome único para o cache do Ministro
const ASSETS = [
  "./Ministro.html", // Prioridade para o arquivo do Ministro
  "./config.js",
  "./mesc-biblico.js",
  "./manifest-ministro.json", // Deve carregar o manifesto do ministro
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => {
      return c.addAll(ASSETS).catch(err => console.log("Erro no cache:", err));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Remove apenas caches antigos deste app específico
  e.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(k => k.includes("mesc-ministro") && k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// OUVIR NOTIFICAÇÕES
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// ESCUTAR MENSAGENS (PARA O BADGE NO ÍCONE)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_BADGE') {
    if (navigator.setAppBadge) navigator.setAppBadge(event.data.count);
  }
});
