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

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating, clearing old caches")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)))
    }),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Pass through all requests directly to network - no caching
  event.respondWith(fetch(event.request))
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

  if (event.action === "complete") {
    // Handle complete action
    console.log("Task completed")
  } else if (event.action === "snooze") {
    // Handle snooze action
    console.log("Task snoozed for 10 minutes")
  } else {
    event.waitUntil(clients.openWindow("/"))
  }
})

console.log("[SW] Service worker loaded, version:", CACHE_NAME)
