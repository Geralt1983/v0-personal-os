const CACHE_NAME = "lifeos-v1"
const ASSETS = ["/", "/manifest.json"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    }),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
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

  if (event.action === "complete") {
    event.waitUntil(clients.openWindow("/?action=complete&task=" + event.notification.tag))
  } else if (event.action === "snooze") {
    event.waitUntil(clients.openWindow("/?action=snooze&task=" + event.notification.tag))
  } else {
    event.waitUntil(clients.openWindow("/"))
  }
})
