const staticCacheName = "restaurant-v1";
const imageCache = "restaurant-images";
const allCaches = [staticCacheName, imageCache];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                '/',
                '/restaurant.html',
                '/js/main.js',
                '/js/dbhelper.js',
                '/js/restaurant_info.js',
                '/css/styles.css',
                '/css/queries.css',
                '/css/restaurantQueries.css',
                '/data/restaurants.json',
            ]);
        }).catch(function (error) {
            console.log(error);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(serverFromCache(event.request, imageCache));
            return;
        }
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(serverFromCache(event.request, staticCacheName, { ignoreSearch: true }));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});

function serverFromCache(request, cacheName, matchOptions) {
    return caches.open(cacheName).then(function (cache) {
        return cache.match(request.url, matchOptions).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}
