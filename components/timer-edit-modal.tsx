"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Minus } from "lucide-react"
import { useState } from "react"

interface TimerEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentMinutes: number
  onSave: (minutes: number) => void
}

export function TimerEditModal({ isOpen, onClose, currentMinutes, onSave }: TimerEditModalProps) {
  const [minutes, setMinutes] = useState(currentMinutes)

  const handleSave = () => {
    onSave(minutes)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs z-50"
          >
            <div className="glass-card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Set Timer</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Timer Control */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setMinutes(Math.max(1, minutes - 5))}
                  className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <Minus className="w-5 h-5 text-slate-300" />
                </button>

                <div className="text-center">
                  <div className="text-4xl font-bold text-accent-cyan">{minutes}</div>
                  <p className="text-sm text-slate-400">minutes</p>
                </div>

                <button
                  onClick={() => setMinutes(Math.min(120, minutes + 5))}
                  className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[5, 10, 15, 25].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMinutes(preset)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      minutes === preset
                        ? "bg-accent-cyan text-bg-base"
                        : "bg-slate-700/30 text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Set Timer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
