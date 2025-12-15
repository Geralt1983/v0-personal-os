"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Zap } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError("Invalid or expired reset link. Please request a new one.")
      }
    }
    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: unknown) {
      console.error("[v0] Reset password error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap className="text-cyan-400" fill="currentColor" size={32} />
            <span className="text-2xl font-bold text-white">LifeOS</span>
          </div>
          <p className="text-slate-500 text-sm">Reset your password</p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password (min 6 characters)"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Repeat New Password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </motion.button>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
            <p className="text-cyan-400 font-medium mb-2">Password reset successful!</p>
            <p className="text-slate-400 text-sm">Redirecting to login...</p>
          </div>
        )}

        <p className="text-center text-slate-500 text-sm mt-6">
          <a href="/auth/login" className="text-cyan-400 hover:underline">
            Back to login
          </a>
        </p>
      </motion.div>
    </div>
  )
}
