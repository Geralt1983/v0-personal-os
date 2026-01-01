"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Sparkles, Zap, Clock, Target, Battery, AlertCircle } from "lucide-react"

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
      setTitle(initialTask.title || "")
      setDescription(initialTask.description || "")
      setPriority(initialTask.priority || "medium")
      setEnergyLevel(initialTask.energy_level || "medium")
      setEstimatedMinutes(initialTask.estimated_minutes || 25)
      setDeadline(initialTask.deadline?.split("T")[0] || "")
    } else {
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

      await onSubmit(taskData)

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
      console.error("[AddTaskForm] Submit failed:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const timePresets = [
    { value: 15, label: "15m", description: "Quick task" },
    { value: 25, label: "25m", description: "Pomodoro" },
    { value: 45, label: "45m", description: "Focus block" },
    { value: 60, label: "1h", description: "Deep work" },
    { value: 90, label: "90m", description: "Extended" },
  ]

  const priorityOptions = [
    { value: "high" as const, label: "High", icon: <AlertCircle className="w-4 h-4" />, color: "red" },
    { value: "medium" as const, label: "Medium", icon: <Target className="w-4 h-4" />, color: "amber" },
    { value: "low" as const, label: "Low", icon: <Sparkles className="w-4 h-4" />, color: "emerald" },
  ]

  const energyOptions = [
    { value: "peak" as const, label: "Peak", icon: <Zap className="w-4 h-4" />, emoji: "⚡" },
    { value: "medium" as const, label: "Normal", icon: <Battery className="w-4 h-4" />, emoji: "⚙️" },
    { value: "low" as const, label: "Low", icon: <Clock className="w-4 h-4" />, emoji: "💤" },
  ]

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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg"
          >
            <div
              className="rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(12, 16, 21, 0.98) 0%, rgba(8, 10, 14, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.05)",
              }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-3xl md:rounded-3xl">
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />
                <div
                  className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-20"
                  style={{
                    background: 'radial-gradient(circle, rgba(191, 127, 255, 0.1) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                  }}
                />
              </div>

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30"
                    animate={{
                      boxShadow: ["0 0 0 rgba(52, 211, 153, 0)", "0 0 15px rgba(52, 211, 153, 0.3)", "0 0 0 rgba(52, 211, 153, 0)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {initialTask ? "Edit Task" : "New Task"}
                    </h2>
                    <p className="text-xs text-text-tertiary">
                      {initialTask ? "Update your task details" : "What's on your mind?"}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl glass-card-sm hover:border-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="relative z-10 p-5 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <Target className="w-4 h-4 text-accent-cyan" />
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    className="w-full px-4 py-4 rounded-2xl glass-card-sm border-white/10 text-white text-lg placeholder:text-text-tertiary focus:outline-none focus:border-accent-cyan/50 transition-all duration-300"
                    required
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <Sparkles className="w-4 h-4 text-accent-purple" />
                    Description
                    <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any notes or context..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl glass-card-sm border-white/10 text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple/50 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {priorityOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`relative py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          priority === option.value
                            ? option.color === "red"
                              ? "bg-red-500/20 text-red-400 border border-red-500/50"
                              : option.color === "amber"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {option.icon}
                        {option.label}
                        {priority === option.value && (
                          <motion.div
                            layoutId="priorityIndicator"
                            className="absolute inset-0 rounded-xl"
                            style={{
                              boxShadow: option.color === "red"
                                ? "0 0 20px rgba(239, 68, 68, 0.3)"
                                : option.color === "amber"
                                  ? "0 0 20px rgba(245, 158, 11, 0.3)"
                                  : "0 0 20px rgba(52, 211, 153, 0.3)"
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <Battery className="w-4 h-4 text-accent-cyan" />
                    Energy Required
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {energyOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setEnergyLevel(option.value)}
                        className={`relative py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          energyLevel === option.value
                            ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-lg">{option.emoji}</span>
                        {option.label}
                        {energyLevel === option.value && (
                          <motion.div
                            layoutId="energyIndicator"
                            className="absolute inset-0 rounded-xl"
                            style={{ boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Estimated Time
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {timePresets.map((preset) => (
                      <motion.button
                        key={preset.value}
                        type="button"
                        onClick={() => setEstimatedMinutes(preset.value)}
                        className={`relative py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                          estimatedMinutes === preset.value
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {preset.label}
                        {estimatedMinutes === preset.value && (
                          <motion.div
                            layoutId="timeIndicator"
                            className="absolute inset-0 rounded-xl"
                            style={{ boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    Deadline
                    <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-card-sm border-white/10 text-white focus:outline-none focus:border-orange-500/50 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-black disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: title.trim() && !submitting
                      ? "0 0 30px rgba(52, 211, 153, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)"
                      : "none",
                  }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ width: '50%' }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        {initialTask ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {initialTask ? "Update Task" : "Create Task"}
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
