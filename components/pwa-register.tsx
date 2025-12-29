"use client"

import { useEffect, useState } from "react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("PWA")

export function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      logger.info("Service worker not supported")
      return
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        setRegistration(reg)
        logger.info("Service worker registered", { scope: reg.scope })

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                logger.info("New service worker available")
                setUpdateAvailable(true)
              }
            })
          }
        })

        // Check for updates periodically
        setInterval(() => {
          reg.update()
        }, 60 * 60 * 1000) // Every hour
      } catch (error) {
        logger.error("Service worker registration failed", {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    registerSW()

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      logger.info("New service worker activated")
    })
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-cyan-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <span className="text-sm">Update available</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-cyan-600 px-3 py-1 rounded text-sm font-medium hover:bg-cyan-50"
      >
        Refresh
      </button>
    </div>
  )
}