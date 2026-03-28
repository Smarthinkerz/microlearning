const CACHE_NAME = 'smarthinkerz-learnshift-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
];

// Install: cache only offline fallback assets (NOT the root page)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches to force fresh content
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Vite HMR and dev-only requests entirely
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__manus__') || url.pathname.startsWith('/node_modules')) {
    return;
  }

  // Navigation requests (HTML pages): ALWAYS network-first, never serve stale HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.pathname.includes('/auth/')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(JSON.stringify({ error: 'offline' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            });
          });
        })
    );
    return;
  }

  // Static assets (images, fonts, CSS, JS): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return cached || new Response('', { status: 503 });
        });
      return cached || fetchPromise;
    })
  );
});

// Background sync for offline lesson progress
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncOfflineProgress());
  }
});

async function syncOfflineProgress() {
  try {
    const db = await openDB();
    const tx = db.transaction('offlineProgress', 'readonly');
    const store = tx.objectStore('offlineProgress');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        await fetch('/api/trpc/attempt.recordProgress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        const deleteTx = db.transaction('offlineProgress', 'readwrite');
        deleteTx.objectStore('offlineProgress').delete(item.id);
      } catch (e) {
        // Will retry on next sync
      }
    }
  } catch (e) {
    console.error('Sync failed:', e);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmarthinkezLearnShift', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineProgress')) {
        db.createObjectStore('offlineProgress', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offlineLessons')) {
        db.createObjectStore('offlineLessons', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Smarthinkerz LearnShift';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/',
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
