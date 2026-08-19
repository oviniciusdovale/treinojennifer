// Bump a versão a cada deploy para invalidar o cache antigo.
var CACHE = "treino-v7";

var SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(chaves.map(function (chave) {
        return chave === CACHE ? null : caches.delete(chave);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Cache primeiro (abre instantâneo e funciona offline na academia), revalidando
// em segundo plano para que a próxima abertura já tenha a versão nova.
self.addEventListener("fetch", function (evento) {
  var req = evento.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cacheado) {
        var rede = fetch(req).then(function (resposta) {
          if (resposta && resposta.ok) cache.put(req, resposta.clone());
          return resposta;
        }).catch(function () {
          return cacheado;
        });
        return cacheado || rede;
      });
    })
  );
});
