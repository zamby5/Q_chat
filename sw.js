// Ask·Q — Servis İşçisi (PWA)
// Önbellek sürümü: v1 — Değiştirince sürümü artır

const CACHE_ADI = 'askq-v1';
const ONBELLEK_DOSYALARI = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Nunito:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Kurulum — dosyaları önbelleğe al
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_ADI).then((cache) => {
      return cache.addAll(ONBELLEK_DOSYALARI).catch(() => {
        // Hata olursa devam et (harici kaynaklar yüklenemeyebilir)
      });
    })
  );
  self.skipWaiting();
});

// Etkinleştirme — eski önbellekleri temizle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(
        anahtarlar
          .filter((k) => k !== CACHE_ADI)
          .map((k) => caches.delete(k))
      )
    )
  );
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
