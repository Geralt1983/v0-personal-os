"use client"

import { motion } from "framer-motion"
import { Clock, Target } from "lucide-react"

interface PlanProgressBarProps {
  completed: number
  total: number
  elapsedMinutes: number
  remainingMinutes: number
  percentage: number
}

export function PlanProgressBar({
  completed,
  total,
  elapsedMinutes,
  remainingMinutes,
  percentage,
}: PlanProgressBarProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mb-4"
    >
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        {/* Progress Text */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">
              {completed} of {total} tasks
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {formatTime(elapsedMinutes)} / {formatTime(elapsedMinutes + remainingMinutes)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Remaining Time Badge */}
        {remainingMinutes > 0 && (
          <div className="mt-2 text-xs text-slate-500 text-right">
            {formatTime(remainingMinutes)} remaining in today's plan
          </div>
        )}
      </div>
    </motion.div>
  )
}
