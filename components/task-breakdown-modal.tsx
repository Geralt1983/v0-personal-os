"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Check, Zap, Battery, BatteryLow } from "lucide-react"

interface MicroMove {
  title: string
  estimatedMinutes: number
  energyLevel: "low" | "medium" | "peak"
}

interface TaskBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  task: { id: string; title: string; description?: string }
  onCreateSubtasks: (subtasks: MicroMove[]) => void
  onReplaceWithFirst: (subtask: MicroMove) => void
}

export function TaskBreakdownModal({
  isOpen,
  onClose,
  task,
  onCreateSubtasks,
  onReplaceWithFirst,
}: TaskBreakdownModalProps) {
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<MicroMove[]>([])
  const [error, setError] = useState<string | null>(null)

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
        }),
      })

      if (!response.ok) throw new Error("Failed to generate breakdown")

      const data = await response.json()
      setSteps(data.steps)
    } catch (err) {
      setError("Couldn't break down this task. Try again?")
    } finally {
      setLoading(false)
    }
  }

  const EnergyIcon = ({ level }: { level: string }) => {
    switch (level) {
      case "peak":
        return <Zap className="w-3 h-3 text-amber-400" />
      case "medium":
        return <Battery className="w-3 h-3 text-cyan-400" />
      default:
        return <BatteryLow className="w-3 h-3 text-slate-400" />
    }
  }

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
            <div className="bg-[#131720] rounded-3xl border border-white/10 overflow-hidden max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Break it down</h2>
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{task.title}</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {!loading && steps.length === 0 && !error && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">✂️</span>
                    </div>
                    <p className="text-slate-300 mb-2">Let AI break this into smaller steps</p>
                    <p className="text-sm text-slate-500 mb-6">Smaller tasks are easier to start and complete</p>
                    <button
                      onClick={generateBreakdown}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium"
                    >
                      Generate Micro-Moves
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Breaking down your task...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={generateBreakdown}
                      className="px-4 py-2 rounded-full bg-white/10 text-white text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {steps.length > 0 && (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-purple-400 font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{step.title}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-slate-500">{step.estimatedMinutes} min</span>
                            <div className="flex items-center gap-1">
                              <EnergyIcon level={step.energyLevel} />
                              <span className="text-xs text-slate-500">{step.energyLevel}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="pt-4 space-y-3">
                      <button
                        onClick={() => onCreateSubtasks(steps)}
                        className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Create All as Tasks
                      </button>
                      <button
                        onClick={() => onReplaceWithFirst(steps[0])}
                        className="w-full py-3 rounded-full bg-white/10 text-white font-medium"
                      >
                        Just Start with Step 1
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
