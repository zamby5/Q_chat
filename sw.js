// Ask·Q — Servis İşçisi (PWA)
// Önbellek sürümü: v1 — Değiştirince sürümü artır

const CACHE_ADI = 'askq-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Kurulum
self.addEventListener('install', (e) => {
  self.skipWaiting();

  e.waitUntil(
    caches.open(CACHE_ADI)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.error('Cache install error:', err))
  );
});

// Aktivasyon
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_ADI)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // API ve POST isteklerini bypass et
  if (
    req.method !== 'GET' ||
    url.hostname.includes('groq-proxy') ||
    url.hostname.includes('groq.com') ||
    url.hostname.includes('workers.dev')
  ) {
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {

          // Sadece güvenli cache edilebilir response
          if (
            res &&
            res.status === 200 &&
            (res.type === 'basic' || res.type === 'cors')
          ) {
            const clone = res.clone();
            caches.open(CACHE_ADI).then(cache => cache.put(req, clone));
          }

          return res;
        })
        .catch(() => {
          // Offline fallback
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
  return self.clients.claim();
});

// İstek yönetimi
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API çağrılarını önbelleğe ALMA
  if (
    url.hostname.includes('groq-proxy') ||
    url.hostname.includes('groq.com') ||
    url.hostname.includes('workers.dev') ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((response) => {
          // Başarılı yanıtları önbelleğe al
          if (response && response.status === 200 && response.type === 'basic') {
            const kopyala = response.clone();
            caches.open(CACHE_ADI).then((cache) => cache.put(e.request, kopyala));
          }
          return response;
        })
        .catch(() => {
          // Çevrimdışı — ana sayfayı döndür
          return caches.match('./index.html');
        });
    })
  );
});
