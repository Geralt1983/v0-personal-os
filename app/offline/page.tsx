"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-slate-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">You&apos;re Offline</h1>
          <p className="text-slate-400">
            No internet connection. Your tasks are saved locally and will sync when you&apos;re back online.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-3">
          <p className="text-sm text-slate-300 font-medium">While offline, you can:</p>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• View your cached tasks</li>
            <li>• Create new tasks (will sync later)</li>
            <li>• Mark tasks as complete</li>
          </ul>
        </div>

        <Button
          onClick={handleRetry}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        <p className="text-xs text-slate-500">
          We&apos;ll automatically reconnect when your connection is restored.
        </p>
      </div>
    </div>
  )
}
