const CACHE_NAME = 'health-journal-static-v1'

function isSameOrigin(url) {
    try {
        return new URL(url).origin === self.location.origin
    } catch {
        return false
    }
}

function isStaticAssetRequest(url) {
    const { pathname } = new URL(url)

    if (pathname === '/manifest.json') return true
    if (pathname.startsWith('/icons/')) return true

    return /\.(js|css|woff2?)$/i.test(pathname)
}

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event

    if (request.method !== 'GET') return
    if (request.mode === 'navigate') return
    if (!isSameOrigin(request.url)) return

    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/')) return
    if (!isStaticAssetRequest(request.url)) return

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(request)
            if (cached) return cached

            const response = await fetch(request)
            if (response.ok) {
                cache.put(request, response.clone())
            }
            return response
        })
    )
})
