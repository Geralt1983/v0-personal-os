"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar } from "lucide-react"

interface AddTaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: {
    title: string
    description?: string
    priority: "high" | "medium" | "low"
    energy_level: "peak" | "medium" | "low"
    estimated_minutes: number
    deadline?: string
  }) => Promise<void>
  initialTask?: any
}

export function AddTaskForm({ isOpen, onClose, onSubmit, initialTask }: AddTaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [energyLevel, setEnergyLevel] = useState<"peak" | "medium" | "low">("medium")
  const [estimatedMinutes, setEstimatedMinutes] = useState(25)
  const [deadline, setDeadline] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialTask) {
      console.log("[v0] AddTaskForm initialTask changed:", initialTask)
      setTitle(initialTask.title || "")
      setDescription(initialTask.description || "")
      setPriority(initialTask.priority || "medium")
      setEnergyLevel(initialTask.energy_level || "medium")
      setEstimatedMinutes(initialTask.estimated_minutes || 25)
      setDeadline(initialTask.deadline?.split("T")[0] || "")
    } else {
      // Reset form for new task
      setTitle("")
      setDescription("")
      setPriority("medium")
      setEnergyLevel("medium")
      setEstimatedMinutes(25)
      setDeadline("")
    }
  }, [initialTask, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    console.log("[v0] AddTaskForm handleSubmit called")
    console.log("[v0] AddTaskForm - title:", title)
    console.log("[v0] AddTaskForm - isEditMode:", !!initialTask)

    setSubmitting(true)
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        energy_level: energyLevel,
        estimated_minutes: estimatedMinutes,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      }

      console.log("[v0] AddTaskForm - calling onSubmit with:", taskData)

      await onSubmit(taskData)

      console.log("[v0] AddTaskForm - onSubmit completed successfully")

      if (!initialTask) {
        setTitle("")
        setDescription("")
        setPriority("medium")
        setEnergyLevel("medium")
        setEstimatedMinutes(25)
        setDeadline("")
      }
      onClose()
    } catch (error) {
      console.error("[v0] AddTaskForm - onSubmit failed:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const timePresets = [15, 25, 45, 60, 90]

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
            className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg"
          >
            <div className="bg-[#0f1419] rounded-t-3xl md:rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0f1419] z-10">
                <h2 className="text-lg font-semibold text-white">{initialTask ? "Edit Task" : "Add Task"}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    className="w-full px-4 py-3 rounded-xl bg-[#1a2332] border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                    required
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details (optional)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a2332] border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          priority === p
                            ? p === "high"
                              ? "bg-red-500/20 text-red-400 border border-red-500/50"
                              : p === "medium"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            : "bg-[#1a2332] text-slate-400 border border-transparent hover:border-white/10"
                        }`}
                      >
                        {p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢"} {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Energy Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["peak", "medium", "low"] as const).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEnergyLevel(e)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          energyLevel === e
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                            : "bg-[#1a2332] text-slate-400 border border-transparent hover:border-white/10"
                        }`}
                      >
                        {e === "peak" ? "⚡" : e === "medium" ? "⚙️" : "💤"} {e.charAt(0).toUpperCase() + e.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Estimated Time</label>
                  <div className="grid grid-cols-5 gap-2">
                    {timePresets.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setEstimatedMinutes(time)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          estimatedMinutes === time
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                            : "bg-[#1a2332] text-slate-400 border border-transparent hover:border-white/10"
                        }`}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Deadline (optional)</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#1a2332] border border-white/5 text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  {submitting
                    ? initialTask
                      ? "Updating..."
                      : "Creating..."
                    : initialTask
                      ? "Update Task"
                      : "+ Create Task"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
