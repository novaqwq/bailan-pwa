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
  console.log('[SW] Activating cache:', CACHE_NAME)
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', k)
          return caches.delete(k)
        }
      }))
    ).then(() => {
      console.log('[SW] Activation complete, claiming clients')
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('deepseek.com')) return
  
  // 对于 app.js，总是尝试从网络获取最新版本
  if (e.request.url.endsWith('/app.js') || e.request.url.endsWith('/app.css')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          console.log('[SW] Fetched from network:', e.request.url)
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, response.clone()))
          return response
        })
        .catch(() => {
          console.log('[SW] Network failed, using cache:', e.request.url)
          return caches.match(e.request)
        })
    )
    return
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
