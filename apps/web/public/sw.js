/**
 * PWA Service Worker：应用外壳预缓存 + Network First 运行时回退。
 * 所属工作台：全局（离线可用性，不影响业务逻辑）。
 * 权限：仅缓存 GET 静态资源与应用外壳；不缓存 /rest/ 与 /storage/ 数据接口。
 */
const SHELL_CACHE = 'tk-observer-shell-v1'
const SHELL_URLS = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/images/favicon.svg',
  '/images/favicon_light.svg',
  '/images/pwa-192.png',
  '/images/pwa-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch((error) => {
        console.error('[pwa] 外壳预缓存失败，部分资源将按需缓存:', error)
      })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

// Network first：在线取最新，失败回退缓存；导航请求回退应用外壳。
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/storage/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches
            .open(SHELL_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {})
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') return caches.match('/')
        return Response.error()
      })
  )
})
