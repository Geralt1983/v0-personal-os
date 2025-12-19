"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Check, ChevronRight, Zap, Battery, BatteryLow, RotateCcw } from "lucide-react"

interface MicroStep {
  title: string
  estimatedMinutes: number
  energyLevel: "low" | "medium" | "peak"
  starterPhrase: string
  completionCue: string
}

interface TaskBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  task: { id: string; title: string; description?: string }
  userEnergy?: "low" | "medium" | "peak"
  onCreateSubtasks: (subtasks: MicroStep[]) => void
  onReplaceWithFirst: (subtask: MicroStep) => void
  onCompleteMainTask?: () => void
}

export function TaskBreakdownModal({
  isOpen,
  onClose,
  task,
  userEnergy = "medium",
  onCreateSubtasks,
  onReplaceWithFirst,
  onCompleteMainTask,
}: TaskBreakdownModalProps) {
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<MicroStep[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"generate" | "stepping" | "complete">("generate")
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("generate")
      setSteps([])
      setActiveStepIndex(0)
      setCompletedSteps(new Set())
      setError(null)
    }
  }, [isOpen])

  const generateBreakdown = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          userEnergy,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate breakdown")

      const data = await response.json()
      setSteps(data.steps)
      setMode("stepping")
    } catch {
      setError("Couldn't break down this task. Try again?")
    } finally {
      setLoading(false)
    }
  }

  const completeCurrentStep = () => {
    setCompletedSteps((prev) => new Set(prev).add(activeStepIndex))

    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1)
    } else {
      setMode("complete")
    }
  }

  const EnergyIcon = ({ level }: { level: string }) => {
    switch (level) {
      case "peak":
        return <Zap className="w-4 h-4 text-amber-400" />
      case "medium":
        return <Battery className="w-4 h-4 text-cyan-400" />
      default:
        return <BatteryLow className="w-4 h-4 text-slate-400" />
    }
  }

  const currentStep = steps[activeStepIndex]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          >
            <div className="bg-[#0d1117] rounded-3xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {mode === "generate"
                      ? "Break it down"
                      : mode === "stepping"
                        ? `Step ${activeStepIndex + 1} of ${steps.length}`
                        : "All steps complete!"}
                  </p>
                  <h2 className="text-lg font-semibold text-white truncate">{task.title}</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white ml-2">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {/* Generate State */}
                {mode === "generate" && !loading && !error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">✂️</span>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Feeling stuck?</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                      I'll break this into tiny steps so small you can't say no to starting.
                    </p>
                    <button
                      onClick={generateBreakdown}
                      className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                    >
                      Break It Down
                    </button>
                  </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Breaking it into tiny pieces...</p>
                  </motion.div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={generateBreakdown} className="px-6 py-3 rounded-full bg-white/10 text-white">
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Try Again
                    </button>
                  </div>
                )}

                {/* Stepping Mode - ONE STEP AT A TIME */}
                {mode === "stepping" && currentStep && (
                  <motion.div
                    key={activeStepIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Current Step Card */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <EnergyIcon level={currentStep.energyLevel} />
                        <span className="text-xs text-slate-500">
                          ~{currentStep.estimatedMinutes} min • {currentStep.energyLevel} energy
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4">{currentStep.title}</h3>
                    </div>

                    {/* STARTER PHRASE - The Key UI Element */}
                    <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
                      <p className="text-sm text-blue-300 mb-2 font-medium">👉 Do this first:</p>
                      <p className="text-2xl font-medium text-white leading-relaxed">"{currentStep.starterPhrase}"</p>
                    </div>

                    {/* Completion Cue */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-sm text-emerald-300">
                        ✓ You'll know you're done when: <span className="text-white">{currentStep.completionCue}</span>
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={completeCurrentStep}
                      className="w-full py-4 rounded-full bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      {activeStepIndex < steps.length - 1 ? (
                        <>
                          Done, Next Step
                          <ChevronRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          Done, Finish Task
                          <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 pt-2">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all ${
                            completedSteps.has(i)
                              ? "w-8 bg-emerald-500"
                              : i === activeStepIndex
                                ? "w-8 bg-blue-500"
                                : "w-2 bg-white/20"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Skip to overview */}
                    <button
                      onClick={() => setMode("generate")}
                      className="w-full text-center text-sm text-slate-500 hover:text-slate-400"
                    >
                      View all steps
                    </button>
                  </motion.div>
                )}

                {/* Complete State */}
                {mode === "complete" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">All steps done!</h3>
                    <p className="text-slate-400 mb-6">You just completed {steps.length} micro-steps. 🎉</p>
                    <button
                      onClick={() => {
                        onCompleteMainTask?.()
                        onClose()
                      }}
                      className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold text-lg"
                    >
                      Complete "{task.title}"
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Footer with alternative actions */}
              {mode === "stepping" && (
                <div className="p-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => onCreateSubtasks(steps)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    Save all as separate tasks
                  </button>
                  <button
                    onClick={() => onReplaceWithFirst(steps[0])}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    Just do step 1 today
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
