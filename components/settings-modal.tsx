"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, Moon, Clock } from "lucide-react"
import { useState } from "react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTimerMinutes: number
  onTimerChange: (minutes: number) => void
}

export function SettingsModal({ isOpen, onClose, defaultTimerMinutes, onTimerChange }: SettingsModalProps) {
  const [timerMinutes, setTimerMinutes] = useState(defaultTimerMinutes)
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  const handleSave = () => {
    onTimerChange(timerMinutes)
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="glass-card p-6 h-full md:h-auto overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Timer Duration */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                    <Clock className="w-4 h-4 text-accent-cyan" />
                    Default Timer Duration
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                    />
                    <span className="text-white font-semibold w-12 text-right">{timerMinutes}m</span>
                  </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <Bell className="w-4 h-4 text-accent-purple" />
                    Notifications
                  </label>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      notifications ? "bg-accent-cyan" : "bg-slate-700"
                    }`}
                  >
                    <motion.div
                      animate={{ x: notifications ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <Moon className="w-4 h-4 text-accent-orange" />
                    Dark Mode
                  </label>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      darkMode ? "bg-accent-cyan" : "bg-slate-700"
                    }`}
                  >
                    <motion.div
                      animate={{ x: darkMode ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full mt-8 py-3 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
