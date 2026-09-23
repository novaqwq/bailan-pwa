const CACHE_NAME = 'bailan-v2'
const ASSETS = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './utils/storage.js',
  './utils/ai.js'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('deepseek.com')) return
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
