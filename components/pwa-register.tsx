"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })

      // Wait a bit for unregistration to complete
      setTimeout(() => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[v0] Service Worker registered with network-first strategy:", registration.scope)

            // Force update on page load
            registration.update()
          })
          .catch((error) => {
            console.error("[v0] Service Worker registration failed:", error)
          })
      }, 100)
    }
  }, [])

  return null
}
