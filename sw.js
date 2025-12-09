importScripts('./config.js');

// Monetag Push Notifications
self.options = {
    "domain": "5gvci.com",
    "zoneId": self.GAME_CONFIG.ads.pushZone
};
self.lary = "";
try {
    importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (e) {}

// Offline Caching
const CACHE_NAME = 'jogos-online-v5';
const URLS_TO_CACHE = [
    './',
    './config.js',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://esm.sh/react@18.2.0',
    'https://esm.sh/react-dom@18.2.0/client',
    'https://esm.sh/lucide-react@0.344.0?deps=react@18.2.0',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js',
    'https://r2.erweima.ai/img/compressed/47748805f42289196b6134a65b3c58e4.png'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force new SW to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

self.addEventListener('activate', event => {
    // Delete old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});