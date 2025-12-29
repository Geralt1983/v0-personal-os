const CACHE_NAME = "lifeos-v1"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.jpg",
  "/icons/icon-512.jpg",
]

// Install event - precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[LifeOS SW] Precaching assets")
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[LifeOS SW] Deleting old cache:", name)
            return caches.delete(name)
          })
      )
    })
  )
  // Take control immediately
  self.clients.claim()
})

// Fetch event - network-first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip API requests (let them fail naturally for offline handling)
  if (request.url.includes("/api/")) return

  // Skip Chrome extension requests
  if (request.url.startsWith("chrome-extension://")) return

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(request)

        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, networkResponse.clone())
        }

        return networkResponse
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request)

        if (cachedResponse) {
          console.log("[LifeOS SW] Serving from cache:", request.url)
          return cachedResponse
        }

        // For navigation requests, show offline page
        if (request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL)
          if (offlinePage) return offlinePage
        }

        // Return a basic offline response
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        })
      }
    })()
  )
})

// Background sync for offline task creation
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    event.waitUntil(syncTasks())
  }
})

async function syncTasks() {
  // Get pending tasks from IndexedDB and sync to server
  console.log("[LifeOS SW] Syncing tasks...")
  // Implementation will be added when offline task creation is built
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title || "LifeOS", {
      body: data.body || "You have a task to complete",
      icon: "/icons/icon-192.jpg",
      badge: "/icons/icon-72.jpg",
      tag: data.tag || "lifeos-notification",
      data: data.data,
    })
  )
})

// Skip waiting message handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes("lifeos") && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    })
  )
})
