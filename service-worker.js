const CACHE_NAME = 'chess-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// इंस्टॉल इवेंट
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('कैश खोली गई');
                return cache.addAll(urlsToCache);
            })
    );
});

// एक्टिवेट इवेंट
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('पुरानी कैश हटाई गई:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// फेच इवेंट
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // कैश में मिली फाइल वापस करें
                if (response) {
                    return response;
                }
                
                // नहीं मिली तो नेटवर्क से लाएं और कैश में स्टोर करें
                return fetch(event.request).then(response => {
                    // केवल वैलिड रिस्पांस को कैश करें
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            }).catch(() => {
                // ऑफलाइन स्थिति में फॉलबैक
                return caches.match('/index.html');
            })
    );
});
