"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Global error boundary caught error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-slate-400">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-slate-800/50 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          If this keeps happening, try refreshing the page or clearing your browser cache.
        </p>
      </div>
    </div>
  )
}
