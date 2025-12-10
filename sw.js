
const CACHE_NAME = 'jogue-ganhe-v12';
const ASSETS = [
    './',
    './index.html',
    './index.css',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
    'https://aistudiocdn.com/lucide-react@^0.554.0',
    'https://esm.sh/@supabase/supabase-js@2.39.3',
    'https://aistudiocdn.com/react-dom@^19.2.1/'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request).catch(() => {
                // Fallback for SPA or offline
                if (e.request.mode === 'navigate') return caches.match('./index.html');
            });
        })
    );
});