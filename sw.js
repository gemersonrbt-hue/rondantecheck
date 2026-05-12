// RodanteCheck Service Worker v4
// Corrigido: caminhos para GitHub Pages + cache completo offline

var CACHE = 'rodantecheck-v4';
var BASE = '/rondantecheck';
var ARQUIVOS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalar — cachear todos os arquivos essenciais
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ARQUIVOS).catch(function(err){
        console.log('Cache parcial:', err);
        // Cachear pelo menos o principal
        return cache.addAll([BASE + '/', BASE + '/index.html']);
      });
    })
  );
  self.skipWaiting();
});

// Ativar — limpar caches antigos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first para arquivos locais, network-first para Supabase
self.addEventListener('fetch', function(e){
  // Supabase sempre vai para rede (dados em tempo real)
  if(e.request.url.includes('supabase.co')){
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;

      return fetch(e.request).then(function(response){
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline — retornar index.html para navegação
        if(e.request.destination === 'document'){
          return caches.match(BASE + '/index.html') || caches.match(BASE + '/');
        }
      });
    })
  );
});
