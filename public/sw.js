/// <reference lib="webworker" />

const CACHE_NAME = 'vaccinetrack-v1';
const RUNTIME_CACHE = 'vaccinetrack-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/add-child.svg',
  '/icons/schedule.svg',
  '/icons/dismiss.svg',
  '/screenshots/dashboard.svg',
  '/screenshots/mobile-dashboard.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.includes('/assets/')) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default handling for other requests
  event.respondWith(handleDefault(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try to return cached response
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for specific endpoints
    if (request.url.includes('/api/parent-dashboard/children')) {
      return new Response(
        JSON.stringify({
          children: [],
          offline: true,
          message: 'You are offline. Showing cached data.'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your internet connection.'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="12">Offline</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' },
          status: 200
        }
      );
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VaccineTrack - Offline</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .offline-icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection to use VaccineTrack.</p>
        <p>Some features may be available offline.</p>
      </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }
}

// Default handling for other requests
async function handleDefault(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-vaccination-data') {
    event.waitUntil(syncVaccinationData());
  }
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(syncVaccinationData());
  }
});

// Sync vaccination data when back online
async function syncVaccinationData() {
  try {
    // Get cached offline actions
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    const offlineActions = requests.filter(request => 
      request.url.includes('/api/') && 
      request.method !== 'GET'
    );

    // Process each offline action
    for (const request of offlineActions) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          // Remove from cache after successful sync
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync:', request.url, error);
      }
    }

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });

  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = event.data ? event.data.json() : {
    title: 'VaccineTrack Reminder',
    body: 'Time for your child\'s vaccination!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'vaccination-reminder',
    actions: [
      {
        action: 'view',
        title: 'View Schedule',
        icon: '/icons/schedule.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/parent-dashboard?tab=schedule')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Export for TypeScript
export default null;

