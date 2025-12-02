// Monetag Push Notifications
self.options = {
    "domain": "5gvci.com",
    "zoneId": 10234210
};
self.lary = "";
try {
    importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (e) {}

// Offline Caching
const CACHE_NAME = 'jogos-online-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
    'https://aistudiocdn.com/lucide-react@^0.554.0',
    'https://r2.erweima.ai/img/compressed/47748805f42289196b6134a65b3c58e4.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                            return response;
                        }
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