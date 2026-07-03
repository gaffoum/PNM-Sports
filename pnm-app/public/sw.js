// Service worker minimal — brique "Application mobile (PWA)".
// Variante pour un déploiement standalone de l'app agents (chaque client a
// son propre domaine, pas de landing séparée sous /agent/ — voir sw.js à la
// racine du dépôt pour la variante du déploiement combiné propre à PNM).
// Ne prend en charge que les requêtes GET same-origin ; les appels vers
// Supabase (API/Auth) traversent toujours le réseau sans interception.
const CACHE = "agent-app-v1";
const APP_SHELL = ["/", "/logo-pnm.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
