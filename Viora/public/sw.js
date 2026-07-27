/* Viora Service Worker — mínimo, apenas para tornar o app instalável (PWA).
   NÃO intercepta navegações nem assets do Next (network-only), para nunca
   servir HTML/CSS/JS desatualizado — isso evita o flash de conteúdo sem
   estilo (FOUC) e o problema de páginas/sessões em cache. */

const LEGACY_CACHE_PREFIX = 'viora';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove qualquer cache de versões anteriores do SW (que faziam cache de HTML).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith(LEGACY_CACHE_PREFIX))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// SEM listener de 'fetch' de propósito: um handler vazio ainda força TODAS
// as requisições (inclusive o CSS crítico) a esperarem o boot do service
// worker — era a causa do flash de página sem estilo (FOUC) no Firefox.
// Sem listener registrado, o navegador ignora o SW nas requisições.
// A instalabilidade do PWA moderna (Chrome 2024+) não exige mais fetch handler.
