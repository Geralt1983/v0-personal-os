"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Lock, Zap } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
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

    console.log("[v0] Sign up attempt:", { email })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            display_name: email.split("@")[0],
          },
        },
      })

      console.log("[v0] Sign up response:", { user: data.user?.id, session: !!data.session, error: error?.message })

      if (error) {
        if (error.message.includes("already registered")) {
          setError(
            "This email is already registered. Please try logging in or use password reset if you forgot your password.",
          )
        } else {
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      // If we got a session, user is confirmed and can proceed
      if (data.session) {
        console.log("[v0] User auto-confirmed, redirecting to app")
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push("/")
        router.refresh()
      } else {
        // Email confirmation required
        console.log("[v0] Email confirmation required")
        router.push("/auth/sign-up-success")
      }
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
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
          <p className="text-slate-500 text-sm">Break paralysis. One task at a time.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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
                placeholder="Password (min 6 characters)"
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
                placeholder="Repeat Password"
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
            {isLoading ? "Creating account..." : "Sign Up"}
          </motion.button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-cyan-400 hover:underline">
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  )
}
