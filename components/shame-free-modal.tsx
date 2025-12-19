"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wind, Loader2, AlertCircle } from "lucide-react"
import { useAppStore } from "@/lib/stores/app-store"

interface Props {
  overdueCount?: number
}

export function ShameFreeModal({ overdueCount = 0 }: Props) {
  const { modals, closeModal, shameFreeReset, preferences } = useAppStore()
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    setIsResetting(true)
    setError(null)

    const result = await shameFreeReset()

    if (result.success) {
      if (preferences.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(200)
      }
    } else {
      setError(result.message || "Something went wrong. Please try again.")
      setIsResetting(false)
    }
  }

  return (
    <AnimatePresence>
      {modals.shameFreeReset && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeModal("shameFreeReset")}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-[#0d1117] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Wind className="text-blue-400 w-10 h-10" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold text-white mb-2">Take a breath.</h2>
                <p className="text-slate-400 mb-2 text-sm leading-relaxed">
                  Life happens. Let's clear the backlog and start fresh.
                </p>
                {overdueCount > 0 && (
                  <p className="text-slate-500 text-xs mb-6">
                    {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"} will be archived
                  </p>
                )}
                {overdueCount === 0 && (
                  <p className="text-slate-500 text-xs mb-6">Your streak will reset, but your total wins stay</p>
                )}
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-3"
              >
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Start Fresh"
                  )}
                </button>
                <button
                  onClick={() => closeModal("shameFreeReset")}
                  disabled={isResetting}
                  className="w-full py-4 bg-transparent text-slate-500 font-medium rounded-2xl hover:text-slate-400 transition-colors disabled:opacity-50"
                >
                  Not now
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-xs text-slate-600"
              >
                Your history is preserved. Only the overwhelm goes away.
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
