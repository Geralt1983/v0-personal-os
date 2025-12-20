const CACHE_NAME = "lifeos-v3"
const ASSETS = ["/", "/manifest.json"]

const NO_CACHE_PATTERNS = [
  /supabase/, // All Supabase API calls
  /\.supabase\.co/, // Supabase domain
  /api\//, // Any API routes
  /auth/, // Auth endpoints
  /_next\/data/, // Next.js data fetching
]

function shouldCache(url) {
  return !NO_CACHE_PATTERNS.some((pattern) => pattern.test(url))
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating, clearing old caches")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name)
            return caches.delete(name)
          }),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = event.request.url

  // NEVER cache API calls - always go to network
  if (!shouldCache(url)) {
    event.respondWith(fetch(event.request))
    return
  }

  // For static assets, use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets only
        if (response.ok && shouldCache(url)) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache only for static assets
        return caches.match(event.request)
      }),
  )
})

// Handle push notifications for reminders
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || "LifeOS Reminder", {
      body: data.body || "You have a task to complete",
      icon: "/icons/icon-192.jpg",
      badge: "/icons/icon-72.jpg",
      vibrate: [200, 100, 200],
      tag: "lifeos-reminder",
      requireInteraction: true,
      actions: [
        { action: "complete", title: "✓ Done" },
        { action: "snooze", title: "Snooze 10m" },
      ],
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"))
  }
})

console.log("[SW] Service worker loaded, version:", CACHE_NAME)
