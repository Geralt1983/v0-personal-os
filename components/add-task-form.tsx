"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Sparkles, Zap, Clock, Target, Battery, AlertCircle, Mic, MicOff, Wand2, Loader2 } from "lucide-react"
import { useTaskParser, type ParseResult } from "@/hooks/use-task-parser"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"

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

// Map AI energy values to form values
const mapEnergy = (aiEnergy: "peak" | "normal" | "low"): "peak" | "medium" | "low" => {
  return aiEnergy === "normal" ? "medium" : aiEnergy
}

export function AddTaskForm({ isOpen, onClose, onSubmit, initialTask }: AddTaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [energyLevel, setEnergyLevel] = useState<"peak" | "medium" | "low">("medium")
  const [estimatedMinutes, setEstimatedMinutes] = useState(25)
  const [deadline, setDeadline] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const [lastAppliedResult, setLastAppliedResult] = useState<ParseResult | null>(null)

  const { isParsing, parseResult, debouncedParse, parseVoice, clearResult } = useTaskParser()
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder()

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || "")
      setDescription(initialTask.description || "")
      setPriority(initialTask.priority || "medium")
      setEnergyLevel(initialTask.energy_level || "medium")
      setEstimatedMinutes(initialTask.estimated_minutes || 25)
      setDeadline(initialTask.deadline?.split("T")[0] || "")
      setShowAiSuggestion(false)
      clearResult()
    } else {
      setTitle("")
      setDescription("")
      setPriority("medium")
      setEnergyLevel("medium")
      setEstimatedMinutes(25)
      setDeadline("")
      setShowAiSuggestion(false)
      clearResult()
    }
  }, [initialTask, isOpen, clearResult])

  // Apply AI parse result to form
  const applyParseResult = useCallback((result: ParseResult) => {
    setTitle(result.task.title)
    if (result.task.description) {
      setDescription(result.task.description)
    }
    setPriority(result.task.priority)
    setEnergyLevel(mapEnergy(result.task.energy))
    setEstimatedMinutes(result.task.estimatedMinutes)
    if (result.task.deadline) {
      const dateStr = result.task.deadline.split("T")[0]
      if (dateStr) setDeadline(dateStr)
    }
    setLastAppliedResult(result)
    setShowAiSuggestion(true)
  }, [])

  // Handle voice recording
  const handleVoiceToggle = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording()
      if (audioBlob.size > 0) {
        setIsTranscribing(true)
        try {
          // Transcribe audio
          const formData = new FormData()
          formData.append("file", audioBlob, "audio.webm")

          const transcribeResponse = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          })

          if (transcribeResponse.ok) {
            const { text } = await transcribeResponse.json()
            if (text) {
              // Parse the transcription with AI
              const result = await parseVoice(text)
              if (result) {
                applyParseResult(result)
              }
            }
          }
        } catch (error) {
          console.error("Voice transcription failed:", error)
        } finally {
          setIsTranscribing(false)
        }
      }
    } else {
      await startRecording()
    }
  }

  // Trigger AI parsing when user types in title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Reset showAiSuggestion so new suggestions can appear
    if (showAiSuggestion) {
      setShowAiSuggestion(false)
    }
    if (value.length > 10 && !initialTask) {
      debouncedParse(value, 800)
    }
  }

  // Apply suggestion button
  const handleApplySuggestion = () => {
    if (parseResult) {
      applyParseResult(parseResult)
    }
  }

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
        setShowAiSuggestion(false)
        clearResult()
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
    { value: "high" as const, label: "High", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "red" },
    { value: "medium" as const, label: "Medium", icon: <Target className="w-3.5 h-3.5" />, color: "amber" },
    { value: "low" as const, label: "Low", icon: <Sparkles className="w-3.5 h-3.5" />, color: "emerald" },
  ]

  const energyOptions = [
    { value: "peak" as const, label: "Peak", icon: <Zap className="w-3.5 h-3.5" />, emoji: "⚡" },
    { value: "medium" as const, label: "Normal", icon: <Battery className="w-3.5 h-3.5" />, emoji: "⚙️" },
    { value: "low" as const, label: "Low", icon: <Clock className="w-3.5 h-3.5" />, emoji: "💤" },
  ]

  // Get confidence indicator for a field
  const getConfidenceStyle = (field: keyof ParseResult["confidence"]["fields"]) => {
    if (!showAiSuggestion || !lastAppliedResult) return ""
    const confidence = lastAppliedResult.confidence.fields[field]
    if (confidence < 0.5) return "ring-2 ring-amber-500/30 ring-offset-1 ring-offset-transparent"
    return ""
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
              <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30"
                    animate={{
                      boxShadow: ["0 0 0 rgba(52, 211, 153, 0)", "0 0 12px rgba(52, 211, 153, 0.3)", "0 0 0 rgba(52, 211, 153, 0)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {initialTask ? "Edit Task" : "New Task"}
                    </h2>
                    <p className="text-[10px] text-text-tertiary">
                      {initialTask ? "Update your task details" : "Speak or type - AI fills the rest"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Voice Button */}
                  <motion.button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isTranscribing}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isRecording
                        ? "bg-red-500/20 border border-red-500/50 text-red-400"
                        : isTranscribing
                          ? "bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan"
                          : "glass-card-sm hover:border-white/20 text-text-secondary hover:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isRecording ? {
                      boxShadow: ["0 0 0 rgba(239, 68, 68, 0)", "0 0 15px rgba(239, 68, 68, 0.5)", "0 0 0 rgba(239, 68, 68, 0)"]
                    } : {}}
                    transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    className="p-1.5 rounded-lg glass-card-sm hover:border-white/20 transition-all duration-300"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </motion.button>
                </div>
              </div>

              {/* AI Suggestion Banner with Preview */}
              <AnimatePresence>
                {parseResult && !showAiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative z-10 px-4 py-2.5 bg-gradient-to-r from-accent-purple/10 to-accent-cyan/10 border-b border-white/5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-accent-purple" />
                        <span className="text-xs text-text-secondary">
                          AI suggestion
                          {parseResult.confidence.overall >= 0.8 && (
                            <span className="ml-1.5 text-[10px] text-emerald-400">High confidence</span>
                          )}
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleApplySuggestion}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/30 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Apply
                      </motion.button>
                    </div>
                    {/* Preview of changes */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/90 font-medium truncate max-w-[180px]">
                        "{parseResult.task.title}"
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        parseResult.task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        parseResult.task.priority === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {parseResult.task.priority}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        parseResult.task.energy === 'peak' ? 'bg-yellow-500/20 text-yellow-400' :
                        parseResult.task.energy === 'low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {parseResult.task.energy === 'normal' ? 'medium' : parseResult.task.energy}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        {parseResult.task.estimatedMinutes}m
                      </span>
                      {parseResult.task.deadline && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                          📅 {new Date(parseResult.task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="relative z-10 p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <Target className="w-3.5 h-3.5 text-accent-cyan" />
                    Task Title
                    {isParsing && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-xs text-accent-purple"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </motion.span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="What do you need to do?"
                      className="w-full px-3 py-2.5 rounded-xl glass-card-sm border-white/10 text-white text-base placeholder:text-text-tertiary focus:outline-none focus:border-accent-cyan/50 transition-all duration-300"
                      required
                      autoFocus
                    />
                    {isParsing && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-purple/10 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
                    Description
                    <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any notes or context..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl glass-card-sm border-white/10 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple/50 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Priority */}
                <div className={getConfidenceStyle("priority")}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    Priority
                    {showAiSuggestion && lastAppliedResult && lastAppliedResult.confidence.fields.priority < 0.5 && (
                      <span className="text-xs text-amber-400">(please review)</span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {priorityOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`relative py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          priority === option.value
                            ? option.color === "red"
                              ? "bg-red-500/20 text-red-400 border border-red-500/50"
                              : option.color === "amber"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {option.icon}
                        {option.label}
                        {priority === option.value && (
                          <motion.div
                            layoutId="priorityIndicator"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              boxShadow: option.color === "red"
                                ? "0 0 15px rgba(239, 68, 68, 0.3)"
                                : option.color === "amber"
                                  ? "0 0 15px rgba(245, 158, 11, 0.3)"
                                  : "0 0 15px rgba(52, 211, 153, 0.3)"
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div className={getConfidenceStyle("energy")}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <Battery className="w-3.5 h-3.5 text-accent-cyan" />
                    Energy Required
                    {showAiSuggestion && lastAppliedResult && lastAppliedResult.confidence.fields.energy < 0.5 && (
                      <span className="text-xs text-amber-400">(please review)</span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {energyOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setEnergyLevel(option.value)}
                        className={`relative py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          energyLevel === option.value
                            ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm">{option.emoji}</span>
                        {option.label}
                        {energyLevel === option.value && (
                          <motion.div
                            layoutId="energyIndicator"
                            className="absolute inset-0 rounded-lg"
                            style={{ boxShadow: "0 0 15px rgba(0, 229, 255, 0.3)" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                <div className={getConfidenceStyle("time")}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Estimated Time
                    {showAiSuggestion && lastAppliedResult && lastAppliedResult.confidence.fields.time < 0.5 && (
                      <span className="text-xs text-amber-400">(please review)</span>
                    )}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {timePresets.map((preset) => (
                      <motion.button
                        key={preset.value}
                        type="button"
                        onClick={() => setEstimatedMinutes(preset.value)}
                        className={`relative py-2 rounded-lg font-medium text-xs transition-all duration-300 ${
                          estimatedMinutes === preset.value
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                            : "glass-card-sm text-text-secondary hover:text-white hover:border-white/20"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {preset.label}
                        {estimatedMinutes === preset.value && (
                          <motion.div
                            layoutId="timeIndicator"
                            className="absolute inset-0 rounded-lg"
                            style={{ boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    Deadline
                    <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl glass-card-sm border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* AI Reasoning (when suggestion applied) */}
                <AnimatePresence>
                  {showAiSuggestion && lastAppliedResult?.reasoning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start gap-2">
                        <Wand2 className="w-4 h-4 text-accent-purple mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-text-tertiary leading-relaxed">
                          {lastAppliedResult.reasoning}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="w-full py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-black disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: title.trim() && !submitting
                      ? "0 0 20px rgba(52, 211, 153, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)"
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
                          className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        {initialTask ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
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
