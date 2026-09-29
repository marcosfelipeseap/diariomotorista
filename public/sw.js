self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado');
});

self.addEventListener('fetch', (e) => {
    // Apenas repassa a requisição para não interferir nas rotas do Node.js
    e.respondWith(fetch(e.request));
});