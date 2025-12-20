const CACHE_NAME = "lifeos-v5"

self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_NAME)
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version:", CACHE_NAME)
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name)
              return caches.delete(name)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
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
    console.log("[SW] Task completed from notification")
  } else if (event.action === "snooze") {
    console.log("[SW] Task snoozed from notification")
  } else {
    event.waitUntil(clients.openWindow("/"))
  }
})

console.log("[SW] Service Worker loaded successfully, version:", CACHE_NAME)
