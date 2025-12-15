"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Lock, Zap } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Login attempt:", { email })

    try {
      const { data: checkData } = await supabase.from("profiles").select("id").eq("email", email).single()

      console.log("[v0] User profile check:", { exists: !!checkData })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login response:", {
        user: data.user?.id,
        session: !!data.session,
        error: error?.message,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError(
            "Email or password is incorrect. Try resetting your password using the 'Forgot password?' link below, or use Demo Mode to try the app.",
          )
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and confirm your account before signing in.")
        } else {
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      if (!data.session) {
        setError("Failed to create session. Please try again.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Login successful, redirecting to home")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Password reset request:", { email })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setResetSent(true)
      console.log("[v0] Password reset email sent")
    } catch (error: unknown) {
      console.error("[v0] Password reset error:", error)
      setError(error instanceof Error ? error.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    localStorage.setItem("lifeos_demo_mode", "true")
    router.push("/demo")
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap className="text-cyan-400" fill="currentColor" size={32} />
            <span className="text-2xl font-bold text-white">LifeOS</span>
          </div>
          <p className="text-slate-500 text-sm">Break paralysis. One task at a time.</p>
        </div>

        {/* Conditional rendering for forgot password vs login */}
        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
                {error.includes("confirm your account") && (
                  <p className="text-slate-400 text-xs mt-2">
                    Didn't receive an email? Check your spam folder or try signing up again.
                  </p>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Sign In"}
            </motion.button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-sm text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          /* Added forgot password form */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {!resetSent ? (
              <>
                <p className="text-slate-400 text-sm text-center mb-4">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      required
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError(null)
                  }}
                  className="w-full text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Back to login
                </button>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <p className="text-cyan-400 font-medium mb-2">Check your email</p>
                <p className="text-slate-400 text-sm mb-4">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetSent(false)
                    setError(null)
                  }}
                  className="text-cyan-400 hover:underline text-sm"
                >
                  Back to login
                </button>
              </div>
            )}
          </form>
        )}

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-600 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={handleDemoMode}
          className="w-full py-3 rounded-xl font-medium bg-[#1a2332] border border-white/10 text-slate-300 hover:bg-[#1a2332]/80 transition-colors"
        >
          Try Demo Mode
        </button>

        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have an account?{" "}
          <a href="/auth/sign-up" className="text-cyan-400 hover:underline">
            Sign up
          </a>
        </p>

        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-white/5">
          <p className="text-slate-400 text-xs text-center">
            <strong className="text-slate-300">Note:</strong> After signing up, you'll need to confirm your email before
            you can log in. Or try Demo Mode for instant access.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
