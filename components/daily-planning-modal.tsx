"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Sun,
  Zap,
  Battery,
  BatteryLow,
  Check,
  ChevronRight,
  Sparkles,
  Clock,
  AlertCircle,
  Target,
  Flame,
  Plus,
} from "lucide-react"
import type { Task } from "@/hooks/use-tasks"
import {
  useDailyPlanning,
  TIME_BUDGETS,
  type EnergyLevel,
  type TaskScore,
} from "@/hooks/use-daily-planning"

interface DailyPlanningModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onPlanCreated?: () => void
}

export function DailyPlanningModal({ isOpen, onClose, tasks, onPlanCreated }: DailyPlanningModalProps) {
  const [step, setStep] = useState<"energy" | "time" | "review">("energy")
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)
  const [availableMinutes, setAvailableMinutes] = useState<number>(240) // Default 4 hours
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)

  const { createPlan, scoreTasksForPlanning } = useDailyPlanning()

  const pendingTasks = tasks.filter((t) => !t.completed && !t.skipped)

  // Calculate scored tasks when energy and time are set
  const scoredTasks = useMemo<TaskScore[]>(() => {
    if (!energyLevel) return []
    return scoreTasksForPlanning(pendingTasks, energyLevel, availableMinutes)
  }, [energyLevel, availableMinutes, pendingTasks, scoreTasksForPlanning])

  // Auto-select top tasks that fit in the time budget
  useEffect(() => {
    if (step === "review" && scoredTasks.length > 0 && selectedTaskIds.size === 0) {
      let totalMinutes = 0
      const autoSelected = new Set<string>()

      for (const scored of scoredTasks) {
        const taskMinutes = scored.task.estimated_minutes || 25
        if (totalMinutes + taskMinutes <= availableMinutes) {
          autoSelected.add(scored.task.id)
          totalMinutes += taskMinutes
        }
      }

      setSelectedTaskIds(autoSelected)
    }
  }, [step, scoredTasks, availableMinutes])

  // Calculate selected tasks' total time
  const selectedTotalMinutes = useMemo(() => {
    return scoredTasks
      .filter((s) => selectedTaskIds.has(s.task.id))
      .reduce((acc, s) => acc + (s.task.estimated_minutes || 25), 0)
  }, [scoredTasks, selectedTaskIds])

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

  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    setStep("time")
  }

  const handleTimeSelect = (minutes: number) => {
    setAvailableMinutes(minutes)
    setSelectedTaskIds(new Set()) // Reset selections
    setStep("review")
  }

  const toggleTaskSelection = (taskId: string, taskMinutes: number) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        // Check if adding this task exceeds time budget
        const newTotal = selectedTotalMinutes + taskMinutes
        if (newTotal <= availableMinutes) {
          next.add(taskId)
        }
      }
      return next
    })
  }

  const handleStartDay = async () => {
    if (!energyLevel || selectedTaskIds.size === 0) return

    setIsCreating(true)
    try {
      const taskIds = scoredTasks
        .filter((s) => selectedTaskIds.has(s.task.id))
        .map((s) => s.task.id)

      await createPlan(energyLevel, availableMinutes, taskIds)
      onPlanCreated?.()
      onClose()
    } catch (err) {
      console.error("Failed to create plan:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400"
    if (score >= 50) return "text-amber-400"
    return "text-slate-400"
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20"
    if (score >= 50) return "bg-amber-500/20"
    return "bg-slate-500/20"
  }

  const EnergyButton = ({
    level,
    icon,
    label,
    description,
    color,
  }: {
    level: EnergyLevel
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

  const TimeButton = ({ label, value }: { label: string; value: number }) => (
    <button
      onClick={() => handleTimeSelect(value)}
      className={`flex-1 p-4 rounded-2xl border transition-all ${
        availableMinutes === value
          ? "bg-cyan-500/20 border-cyan-500/50"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <p className="text-2xl font-bold text-white">{value / 60}h</p>
      <p className="text-xs text-slate-400">{label}</p>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {step !== "energy" && (
                    <button
                      onClick={() => setStep(step === "review" ? "time" : "energy")}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <span className="text-sm text-slate-500">
                    {step === "energy" ? "Step 1 of 3" : step === "time" ? "Step 2 of 3" : "Step 3 of 3"}
                  </span>
                </div>
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
                      level="high"
                      icon={<Zap className="w-6 h-6 text-amber-400" />}
                      label="High Energy"
                      description="Ready to tackle anything"
                      color="bg-amber-500/20"
                    />
                    <EnergyButton
                      level="normal"
                      icon={<Battery className="w-6 h-6 text-cyan-400" />}
                      label="Normal Energy"
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

              {/* Time Budget Step */}
              {step === "time" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-8 h-8 text-cyan-400" />
                      <h1 className="text-2xl font-bold text-white">Time Budget</h1>
                    </div>
                    <p className="text-slate-400">How much time do you have today?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {TIME_BUDGETS.map((budget) => (
                      <TimeButton key={budget.value} label={budget.label} value={budget.value} />
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">AI will suggest tasks that fit your time</span>
                    </div>
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
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold text-white">Your Plan</h2>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {energyLevel} energy • {availableMinutes / 60} hours available
                    </p>
                  </div>

                  {/* Time Budget Progress */}
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Time allocated</span>
                      <span className="text-sm font-medium text-white">
                        {selectedTotalMinutes} / {availableMinutes} min
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          selectedTotalMinutes > availableMinutes
                            ? "bg-red-500"
                            : selectedTotalMinutes >= availableMinutes * 0.8
                            ? "bg-emerald-500"
                            : "bg-cyan-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (selectedTotalMinutes / availableMinutes) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="flex-1 space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
                    {scoredTasks.map((scored, index) => {
                      const isSelected = selectedTaskIds.has(scored.task.id)
                      const taskMinutes = scored.task.estimated_minutes || 25
                      const wouldExceedBudget =
                        !isSelected && selectedTotalMinutes + taskMinutes > availableMinutes

                      return (
                        <motion.button
                          key={scored.task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleTaskSelection(scored.task.id, taskMinutes)}
                          disabled={wouldExceedBudget && !isSelected}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                            isSelected
                              ? "bg-cyan-500/20 border-cyan-500/50"
                              : wouldExceedBudget
                              ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {/* Score Badge */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getScoreBg(
                              scored.total
                            )}`}
                          >
                            <span className={`text-sm font-bold ${getScoreColor(scored.total)}`}>
                              {scored.total}
                            </span>
                          </div>

                          {/* Task Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{scored.task.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {scored.task.estimated_minutes} min
                              </span>
                              {scored.breakdown.deadlineUrgency > 0 && (
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {scored.breakdown.deadlineUrgency >= 35 ? "Today" : "Soon"}
                                </span>
                              )}
                              {scored.breakdown.energyMatch === 20 && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  Match
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selection Toggle */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSelected ? "bg-cyan-500" : "bg-white/10"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : wouldExceedBudget ? (
                              <X className="w-4 h-4 text-slate-500" />
                            ) : (
                              <Plus className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}

                    {scoredTasks.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <p>No tasks available</p>
                        <p className="text-sm">Add some tasks first!</p>
                      </div>
                    )}
                  </div>

                  {/* Start Day Button */}
                  <div className="mt-auto pt-4">
                    <button
                      onClick={handleStartDay}
                      disabled={selectedTaskIds.size === 0 || isCreating}
                      className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                        />
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Start Day with {selectedTaskIds.size} Tasks
                        </>
                      )}
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
