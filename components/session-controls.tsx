"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, Vibrate, Bell } from "lucide-react"

interface SessionControlsProps {
  isOpen: boolean
  onClose: () => void
}

export function SessionControls({ isOpen, onClose }: SessionControlsProps) {
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(false)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  useEffect(() => {
    // Load from localStorage
    const savedFocus = localStorage.getItem("sessionFocusDuration")
    const savedBreak = localStorage.getItem("sessionBreakDuration")
    const savedSound = localStorage.getItem("sessionSound")
    const savedVibration = localStorage.getItem("sessionVibration")
    const savedAlerts = localStorage.getItem("sessionAlerts")

    if (savedFocus) setFocusDuration(Number.parseInt(savedFocus))
    if (savedBreak) setBreakDuration(Number.parseInt(savedBreak))
    if (savedSound) setSoundEnabled(savedSound === "true")
    if (savedVibration) setVibrationEnabled(savedVibration === "true")
    if (savedAlerts) setAlertsEnabled(savedAlerts === "true")
  }, [])

  const handleFocusChange = (minutes: number) => {
    setFocusDuration(minutes)
    localStorage.setItem("sessionFocusDuration", minutes.toString())
  }

  const handleBreakChange = (minutes: number) => {
    setBreakDuration(minutes)
    localStorage.setItem("sessionBreakDuration", minutes.toString())
  }

  const handleToggle = (type: "sound" | "vibration" | "alerts", value: boolean) => {
    switch (type) {
      case "sound":
        setSoundEnabled(value)
        localStorage.setItem("sessionSound", value.toString())
        break
      case "vibration":
        setVibrationEnabled(value)
        localStorage.setItem("sessionVibration", value.toString())
        break
      case "alerts":
        setAlertsEnabled(value)
        localStorage.setItem("sessionAlerts", value.toString())
        break
    }
  }

  const focusOptions = [15, 25, 45, 60]
  const breakOptions = [3, 5, 10]

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
            className="fixed inset-0 z-40"
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.15 }}
            className="fixed right-6 top-20 w-[280px] z-50"
            style={{
              background: "rgba(20, 25, 35, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Session</div>

              {/* Focus Duration */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⏱</span>
                  <span className="text-sm text-slate-300">Focus Duration</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {focusOptions.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleFocusChange(time)}
                      className={`h-9 rounded-lg text-sm font-medium transition-all ${
                        focusDuration === time
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/30"
                          : "bg-white/6 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Break Duration */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">☕</span>
                  <span className="text-sm text-slate-300">Break Duration</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {breakOptions.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleBreakChange(time)}
                      className={`h-9 rounded-lg text-sm font-medium transition-all ${
                        breakDuration === time
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/30"
                          : "bg-white/6 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Toggles */}
              <div className="space-y-4">
                <ToggleRow
                  icon={<Volume2 size={18} />}
                  label="Sound Effects"
                  enabled={soundEnabled}
                  onChange={(value) => handleToggle("sound", value)}
                />
                <ToggleRow
                  icon={<Vibrate size={18} />}
                  label="Vibration"
                  enabled={vibrationEnabled}
                  onChange={(value) => handleToggle("vibration", value)}
                />
                <ToggleRow
                  icon={<Bell size={18} />}
                  label="Timer Alerts"
                  enabled={alertsEnabled}
                  onChange={(value) => handleToggle("alerts", value)}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ToggleRow({
  icon,
  label,
  enabled,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-white/10"}`}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  )
}
