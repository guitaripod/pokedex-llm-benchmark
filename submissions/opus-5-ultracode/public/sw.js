const VERSION = 'pokedex-v1'
const SHELL_CACHE = `${VERSION}-shell`
const DATA_CACHE = `${VERSION}-data`
const MEDIA_CACHE = `${VERSION}-media`

const MEDIA_LIMIT = 700
const DATA_LIMIT = 900

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg'])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, DATA_CACHE, DATA_LIMIT))
    return
  }

  if (url.pathname.startsWith('/img/') || url.pathname.startsWith('/cry/')) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE, MEDIA_LIMIT))
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE, 200))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(request))
  }
})

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
      trim(cacheName, limit)
    }
    return response
  } catch (error) {
    const fallback = await cache.match(request)
    if (fallback) return fallback
    throw error
  }
}

async function networkFirstDocument(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put('/', response.clone())
    return response
  } catch (error) {
    const cached = (await cache.match('/')) ?? (await cache.match(request))
    if (cached) return cached
    throw error
  }
}

/// Evicts the oldest entries once a cache exceeds its budget, keeping storage bounded.
async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= limit) return
  for (const key of keys.slice(0, keys.length - limit)) await cache.delete(key)
}
