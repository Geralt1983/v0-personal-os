"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X } from "lucide-react"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Only show if not already dismissed in this session
      const dismissed = sessionStorage.getItem("install-prompt-dismissed")
      if (!dismissed) {
        setShowPrompt(true)
      }
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem("install-prompt-dismissed", "true")
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 p-4 bg-[#1a2332] rounded-2xl border border-white/10 flex items-center gap-4 z-50 shadow-2xl"
        >
          <div className="flex-1">
            <p className="font-semibold text-white">Install LifeOS</p>
            <p className="text-sm text-slate-400">Add to home screen for the full experience</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium flex items-center gap-2 hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            <Download size={16} />
            Install
          </button>
          <button onClick={handleDismiss} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
