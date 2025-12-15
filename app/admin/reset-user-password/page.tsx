"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield } from "lucide-react"

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call the admin API route to reset password
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setResult(`Password successfully reset for ${email}. You can now log in with your new password.`)
      setEmail("")
      setNewPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Shield className="text-orange-400" size={32} />
            <span className="text-2xl font-bold text-white">Admin Password Reset</span>
          </div>
          <p className="text-slate-500 text-sm">Directly reset any user's password</p>
        </div>

        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-6">
          <p className="text-orange-400 text-sm font-medium mb-1">Admin Tool</p>
          <p className="text-slate-400 text-xs">
            This bypasses normal password reset flows. Use this if you're unable to receive password reset emails.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">User Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 rounded-xl bg-[#1a2332] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-emerald-400 text-sm">{result}</p>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-red-600 text-white disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-cyan-400 hover:underline text-sm">
            Back to login
          </a>
        </div>
      </motion.div>
    </div>
  )
}
