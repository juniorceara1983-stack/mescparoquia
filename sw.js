/* Service Worker MESC — permite instalar como app e uso básico offline das páginas em cache */
var CACHE_NAME = "mesc-paroquia-v1";
var PRECACHE = [
  "./Mesc.html",
  "./Ministro.html",
  "./PainelCoordenador.html",
  "./config.js",
  "./mesc-biblico.js",
  "./manifest.json",
  "./icons/mesc.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () {
        return cache.add("./Mesc.html").catch(function () {});
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var u = event.request.url;
  if (u.indexOf("script.google.com") !== -1) return;
  event.respondWith(
    fetch(event.request).then(function (res) {
      return res;
    }).catch(function () {
      return caches.match(event.request).then(function (r) {
        return r || caches.match("./Mesc.html");
      });
    })
  );
});
