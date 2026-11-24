// Pronto Atleta Camminata - service worker
const V='pac-v2', TILES='pac-tiles', MAX_TILES=4000;
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pac-')&&k!==V&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function pulisci(c){const k=await c.keys();if(k.length>MAX_TILES)for(let i=0;i<k.length-MAX_TILES;i++)await c.delete(k[i]);}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);
  // Riquadri delle mappe: prima la memoria (funziona senza segnale), poi la rete
  if(/(^|\.)tile\.openstreetmap\.org$|(^|\.)tile\.opentopomap\.org$/.test(u.hostname)){
    e.respondWith(caches.open(TILES).then(async c=>{
      const hit=await c.match(req.url);if(hit)return hit;
      try{const r=await fetch(req);if(r.ok||r.type==='opaque'){c.put(req.url,r.clone());if(Math.random()<0.03)pulisci(c);}return r;}
      catch(err){return new Response('',{status:504});}
    }));return;
  }
  // Libreria mappe (Leaflet): dalla memoria
  if(u.hostname==='unpkg.com'){
    e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r;}));return;
  }
  // File dell'app: prima la rete (aggiornamenti), poi la memoria
  if(u.origin===location.origin){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(req,cp));}return r;}).catch(()=>caches.match(req).then(h=>h||caches.match('./index.html'))));
  }
});
