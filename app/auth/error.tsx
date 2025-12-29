"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/logger"

const logger = createLogger("Auth")

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Auth error boundary caught error", {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
          <p className="text-slate-400">
            We couldn&apos;t complete the authentication process. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = "/auth/login"}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}
