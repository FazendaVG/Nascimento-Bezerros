// Service Worker - Fazenda Volta Grande
// Sempre que alterar o index.html, aumente o número da versão abaixo
// para que os aparelhos baixem a versão nova.
const VERSAO = 'vg-v3';

const ARQUIVOS_LOCAIS = ['./', 'index.html', 'manifest.json', 'logo.png'];
const ARQUIVOS_CDN = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await Promise.allSettled([
      ...ARQUIVOS_LOCAIS.map(u => cache.add(u)),
      ...ARQUIVOS_CDN.map(u => cache.add(new Request(u, { mode: 'no-cors' })))
    ]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Dados da planilha: nunca guardar em cache aqui (o app cuida disso)
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Páginas: tenta a internet; sem sinal, usa a cópia guardada
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req);
        const cache = await caches.open(VERSAO);
        cache.put('index.html', resp.clone());
        return resp;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true })) ||
               (await caches.match('index.html')) ||
               (await caches.match('./'));
      }
    })());
    return;
  }

  // Demais arquivos: usa o guardado e atualiza em segundo plano
  event.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const guardado = await cache.match(req);
    const atualizar = fetch(req).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
      return resp;
    }).catch(() => null);
    return guardado || (await atualizar) || Response.error();
  })());
});
