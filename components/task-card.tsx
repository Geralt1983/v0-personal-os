"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Zap, Sparkles, ChevronRight, Play, Brain } from "lucide-react"
import type { Task, BestTimeBucket } from "@/lib/types"
import { prettyBestTime } from "@/lib/analyze-task"

interface TaskCardProps {
  task: Task
  variant: "primary" | "secondary"
  onSelect: () => void
  onAction: (action: string) => void
}

function getTimeConfig(
  bestTime?: BestTimeBucket,
  recommendation?: string,
): {
  textColor: string
  gradientFrom: string
  gradientTo: string
  glowColor: string
  label: string
  icon: string
} {
  if (bestTime) {
    switch (bestTime) {
      case "now":
        return {
          textColor: "text-emerald-400",
          gradientFrom: "from-emerald-500/20",
          gradientTo: "to-green-600/20",
          glowColor: "rgba(52, 211, 153, 0.3)",
          label: prettyBestTime(bestTime),
          icon: "⚡"
        }
      case "morning_meeting_window":
        return {
          textColor: "text-amber-400",
          gradientFrom: "from-amber-500/20",
          gradientTo: "to-orange-600/20",
          glowColor: "rgba(251, 191, 36, 0.3)",
          label: prettyBestTime(bestTime),
          icon: "🌅"
        }
      case "focus_block":
        return {
          textColor: "text-purple-400",
          gradientFrom: "from-purple-500/20",
          gradientTo: "to-violet-600/20",
          glowColor: "rgba(168, 85, 247, 0.3)",
          label: prettyBestTime(bestTime),
          icon: "🎯"
        }
      case "evening_wind_down":
        return {
          textColor: "text-blue-400",
          gradientFrom: "from-blue-500/20",
          gradientTo: "to-indigo-600/20",
          glowColor: "rgba(59, 130, 246, 0.3)",
          label: prettyBestTime(bestTime),
          icon: "🌙"
        }
      case "weekend":
        return {
          textColor: "text-cyan-400",
          gradientFrom: "from-cyan-500/20",
          gradientTo: "to-teal-600/20",
          glowColor: "rgba(34, 211, 238, 0.3)",
          label: prettyBestTime(bestTime),
          icon: "📅"
        }
      default:
        return {
          textColor: "text-text-secondary",
          gradientFrom: "from-white/5",
          gradientTo: "to-white/5",
          glowColor: "transparent",
          label: prettyBestTime(bestTime),
          icon: "📌"
        }
    }
  }

  if (!recommendation) {
    return {
      textColor: "text-text-secondary",
      gradientFrom: "from-white/5",
      gradientTo: "to-white/5",
      glowColor: "transparent",
      label: "",
      icon: ""
    }
  }

  const lower = recommendation.toLowerCase()

  if (lower.includes("now")) {
    return {
      textColor: "text-emerald-400",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-green-600/20",
      glowColor: "rgba(52, 211, 153, 0.3)",
      label: recommendation,
      icon: "⚡"
    }
  }
  if (lower.includes("morning") || lower.includes("am")) {
    return {
      textColor: "text-amber-400",
      gradientFrom: "from-amber-500/20",
      gradientTo: "to-orange-600/20",
      glowColor: "rgba(251, 191, 36, 0.3)",
      label: recommendation,
      icon: "🌅"
    }
  }
  if (lower.includes("focus") || lower.includes("deep")) {
    return {
      textColor: "text-purple-400",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-violet-600/20",
      glowColor: "rgba(168, 85, 247, 0.3)",
      label: recommendation,
      icon: "🎯"
    }
  }
  if (lower.includes("evening") || lower.includes("pm") || lower.includes("night")) {
    return {
      textColor: "text-blue-400",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-indigo-600/20",
      glowColor: "rgba(59, 130, 246, 0.3)",
      label: recommendation,
      icon: "🌙"
    }
  }
  return {
    textColor: "text-text-secondary",
    gradientFrom: "from-white/5",
    gradientTo: "to-white/5",
    glowColor: "transparent",
    label: recommendation,
    icon: "📌"
  }
}

function getExpiryStatus(task: Task): { label: string; severity: "expired" | "expiring" | null } | null {
  if (!task.expiresAt) return null
  const now = new Date()
  const expiryDate = new Date(task.expiresAt)
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays)
    return { label: `Expired ${daysAgo}d ago`, severity: "expired" }
  }
  if (diffDays === 0) {
    return { label: "Due today", severity: "expiring" }
  }
  if (diffDays <= 2) {
    return { label: `${diffDays}d left`, severity: "expiring" }
  }
  return null
}

export function TaskCard({ task, variant, onSelect, onAction }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const timeConfig = getTimeConfig(task.bestTime, task.aiRecommendation)
  const expiryStatus = getExpiryStatus(task)

  if (variant === "primary") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isCompleting ? 0 : 1, y: isCompleting ? -10 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative group"
      >
        {/* Animated glow effect on hover */}
        <motion.div
          className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent-cyan/20 via-accent-purple/20 to-accent-cyan/20 opacity-0 blur-xl transition-opacity duration-500"
          animate={{ opacity: isHovered ? 0.6 : 0 }}
        />

        <div
          className="glass-card-premium p-6 cursor-pointer relative overflow-hidden"
          onClick={onSelect}
        >
          {/* Top accent line with gradient */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan/50 to-transparent" />

          {/* Expiry indicator */}
          {expiryStatus && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4"
            >
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  expiryStatus.severity === "expired"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                <Clock className="w-3 h-3" />
                {expiryStatus.label}
              </span>
            </motion.div>
          )}

          {/* Task Title */}
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-3">
            {task.title}
          </h3>

          {/* AI Tags */}
          {task.aiTags && task.aiTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {task.aiTags.slice(0, 4).map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                    tag.toLowerCase() === "quick win"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-text-secondary border border-white/10"
                  }`}
                >
                  {tag.toLowerCase() === "quick win" && <Zap className="w-3 h-3" />}
                  {tag}
                </motion.span>
              ))}
            </div>
          )}

          {/* Time recommendation */}
          {timeConfig.label && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${timeConfig.gradientFrom} ${timeConfig.gradientTo} border border-white/10 mb-4`}
            >
              <span className="text-sm">{timeConfig.icon}</span>
              <span className={`text-xs font-medium ${timeConfig.textColor}`}>
                {timeConfig.label}
              </span>
            </motion.div>
          )}

          {/* Context and ETA */}
          <div className="space-y-1 mb-6">
            {task.context && (
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-accent-purple" />
                {task.context}
              </p>
            )}
            {(task.etaMinutes || task.eta) && (
              <p className="text-sm text-text-tertiary flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {task.etaMinutes ? `${task.etaMinutes} min` : `ETA ${task.eta}`}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                setIsCompleting(true)
                setTimeout(() => onAction("do"), 150)
              }}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 relative overflow-hidden group/btn"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                boxShadow: "0 0 20px rgba(52, 211, 153, 0.3), 0 4px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ width: '50%' }}
              />
              <Play className="w-4 h-4 relative z-10" fill="currentColor" />
              <span className="relative z-10">Do it now</span>
            </motion.button>

            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onAction("decide")
              }}
              className="flex-1 py-3.5 rounded-xl glass-card-sm text-text-secondary hover:text-white font-medium text-sm flex items-center justify-center gap-2 border-white/10 hover:border-white/20 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Decide</span>
            </motion.button>
          </div>

          {/* Hover arrow indicator */}
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2"
            animate={{ opacity: isHovered ? 0.5 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-6 h-6 text-white/50" />
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Secondary variant - compact card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isCompleting ? 0 : 1, y: isCompleting ? -5 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <motion.div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10 opacity-0 blur-md transition-opacity duration-300"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
      />

      <div
        className="glass-card-sm p-4 cursor-pointer relative overflow-hidden hover:border-white/20 transition-all duration-300"
        onClick={onSelect}
      >
        {/* Expiry indicator */}
        {expiryStatus && (
          <div className="absolute top-0 left-0 right-0 h-[2px]">
            <div className={`h-full ${
              expiryStatus.severity === "expired"
                ? "bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50"
                : "bg-gradient-to-r from-amber-500/50 via-amber-500 to-amber-500/50"
            }`} />
          </div>
        )}

        {expiryStatus && (
          <span
            className={`inline-block text-[10px] font-semibold mb-2 ${
              expiryStatus.severity === "expired" ? "text-red-400" : "text-amber-400"
            }`}
          >
            {expiryStatus.label}
          </span>
        )}

        <h3 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2 mb-2">
          {task.title}
        </h3>

        {timeConfig.label && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs">{timeConfig.icon}</span>
            <span className={`text-[10px] font-medium ${timeConfig.textColor}`}>
              {timeConfig.label}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-text-tertiary">
          {(task.etaMinutes || task.eta) && (
            <span className="text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.etaMinutes ? `${task.etaMinutes}m` : task.eta}
            </span>
          )}
        </div>

        {/* Hover effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 to-accent-purple/5 opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  )
}
