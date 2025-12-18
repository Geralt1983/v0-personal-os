"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sun, Zap, Battery, BatteryLow, Check, ChevronRight, Sparkles } from "lucide-react"
import type { Task } from "@/hooks/use-tasks"
import { smartSortTasks } from "@/lib/smart-sort"

interface DailyPlanningModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onSetEnergyLevel: (level: "peak" | "medium" | "low") => void
  onStartDay: (topTasks: Task[]) => void
}

export function DailyPlanningModal({ isOpen, onClose, tasks, onSetEnergyLevel, onStartDay }: DailyPlanningModalProps) {
  const [step, setStep] = useState<"energy" | "review" | "ready">("energy")
  const [energyLevel, setEnergyLevel] = useState<"peak" | "medium" | "low" | null>(null)
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([])

  const pendingTasks = tasks.filter((t) => !t.completed && !t.skipped)
  const dueTodayCount = pendingTasks.filter((t) => {
    if (!t.deadline) return false
    const deadline = new Date(t.deadline)
    const today = new Date()
    return deadline.toDateString() === today.toDateString()
  }).length

  const overdueCount = pendingTasks.filter((t) => {
    if (!t.deadline) return false
    return new Date(t.deadline) < new Date()
  }).length

  useEffect(() => {
    if (energyLevel) {
      const sorted = smartSortTasks(pendingTasks, { userEnergyLevel: energyLevel })
      setSuggestedTasks(sorted.slice(0, 3))
    }
  }, [energyLevel, tasks])

  const handleEnergySelect = (level: "peak" | "medium" | "low") => {
    setEnergyLevel(level)
    onSetEnergyLevel(level)
    setStep("review")
  }

  const handleStartDay = () => {
    onStartDay(suggestedTasks)
    onClose()
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const EnergyButton = ({
    level,
    icon,
    label,
    description,
    color,
  }: {
    level: "peak" | "medium" | "low"
    icon: React.ReactNode
    label: string
    description: string
    color: string
  }) => (
    <button
      onClick={() => handleEnergySelect(level)}
      className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${
        energyLevel === level ? `${color} border-current` : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          energyLevel === level ? "bg-white/20" : "bg-white/10"
        }`}
      >
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {energyLevel === level && <Check className="w-5 h-5 text-white" />}
    </button>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0f16] z-50"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="min-h-screen p-6 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Energy Selection Step */}
              {step === "energy" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Sun className="w-8 h-8 text-amber-400" />
                      <h1 className="text-2xl font-bold text-white">{greeting()}</h1>
                    </div>
                    <p className="text-slate-400">How's your energy right now?</p>
                  </div>

                  {/* Stats Banner */}
                  <div className="flex gap-4 mb-8">
                    <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
                      <p className="text-sm text-slate-400">tasks pending</p>
                    </div>
                    {dueTodayCount > 0 && (
                      <div className="flex-1 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-2xl font-bold text-amber-400">{dueTodayCount}</p>
                        <p className="text-sm text-amber-400/70">due today</p>
                      </div>
                    )}
                    {overdueCount > 0 && (
                      <div className="flex-1 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
                        <p className="text-sm text-red-400/70">overdue</p>
                      </div>
                    )}
                  </div>

                  {/* Energy Options */}
                  <div className="space-y-3">
                    <EnergyButton
                      level="peak"
                      icon={<Zap className="w-6 h-6 text-amber-400" />}
                      label="Peak Energy"
                      description="Ready to tackle anything"
                      color="bg-amber-500/20"
                    />
                    <EnergyButton
                      level="medium"
                      icon={<Battery className="w-6 h-6 text-cyan-400" />}
                      label="Medium Energy"
                      description="Steady and focused"
                      color="bg-cyan-500/20"
                    />
                    <EnergyButton
                      level="low"
                      icon={<BatteryLow className="w-6 h-6 text-slate-400" />}
                      label="Low Energy"
                      description="Taking it easy"
                      color="bg-slate-500/20"
                    />
                  </div>
                </motion.div>
              )}

              {/* Review Step */}
              {step === "review" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold text-white">Your Top 3 for Today</h2>
                    </div>
                    <p className="text-slate-400 text-sm">Based on your {energyLevel} energy level</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {suggestedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{task.estimated_minutes || 25} min</span>
                            {task.deadline && (
                              <span className="text-xs text-amber-400">
                                Due {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() => setStep("energy")}
                      className="w-full py-3 rounded-full bg-white/10 text-white font-medium"
                    >
                      Change Energy Level
                    </button>
                    <button
                      onClick={handleStartDay}
                      className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Start My Day
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
