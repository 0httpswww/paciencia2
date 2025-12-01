self.options = {
    "domain": "5gvci.com",
    "zoneId": 10234210
}
self.lary = ""
try {
    importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')
} catch (e) {
    console.log("Ad script import failed", e);
}

const CACHE_NAME = 'jogos-online-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
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
                return fetch(event.request);
            })
    );
});