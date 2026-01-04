"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Flame, Zap, Target, AlertTriangle } from "lucide-react"
import type { UserStats } from "@/lib/types"

interface SurveillanceTask {
  id: string
  title: string
  daysOverdue: number
}

interface WarRoomDashboardProps {
  stats: UserStats
  surveillanceTasks: SurveillanceTask[]
  onBack: () => void
  onTaskSelect: (task: SurveillanceTask) => void
}

export function WarRoomDashboard({ stats, surveillanceTasks, onBack }: WarRoomDashboardProps) {
  const statCards = [
    {
      icon: <Flame size={20} className="text-orange-400" />,
      value: stats.currentStreak,
      label: "Day Streak",
      unit: "days",
    },
    {
      icon: <Zap size={20} className="text-cyan-400" />,
      value: `${stats.trustScore}%`,
      label: "Trust Score",
      unit: null,
    },
    {
      icon: <Target size={20} className="text-emerald-400" />,
      value: `${stats.weeklyCompletionRate || 85}%`,
      label: "Weekly Complete",
      unit: null,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-semibold">War Room</h1>
        <div className="w-16" />
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 p-5">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-2xl bg-[#131720] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-3">
              {stat.icon}
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
            <div className="text-4xl font-bold text-white">{stat.value}</div>
            {stat.unit && <div className="text-sm text-slate-600 mt-1">{stat.unit}</div>}
          </motion.div>
        ))}
      </div>

      {/* Surveillance Section */}
      {surveillanceTasks.length > 0 && (
        <div className="px-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Under Surveillance</h2>
          </div>

          <div className="space-y-3">
            {surveillanceTasks.map((task, index) => {
              const isOverdue = task.daysOverdue && task.daysOverdue > 0
              const isUrgent = isOverdue && task.daysOverdue >= 2

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-l-4 ${
                    isUrgent ? "bg-red-500/10 border-red-500" : "bg-amber-500/10 border-amber-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {task.daysOverdue} {task.daysOverdue === 1 ? "day" : "days"} overdue
                      </p>
                    </div>
                    {isUrgent && (
                      <span className="px-2 py-1 text-xs font-bold text-red-400 bg-red-500/20 rounded">URGENT</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state for surveillance */}
      {surveillanceTasks.length === 0 && (
        <div className="px-5 mt-8">
          <div className="p-8 rounded-2xl bg-[#131720] border border-white/5 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-medium text-white mb-1">All Clear</h3>
            <p className="text-sm text-slate-500">No overdue tasks. Keep it up!</p>
          </div>
        </div>
      )}
    </div>
  )
}
