"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Flame, Zap, Target, Clock, AlertTriangle, TrendingUp } from "lucide-react"
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
  const mockWeekData = [
    { name: "M", completed: 4, total: 4 },
    { name: "T", completed: 3, total: 3 },
    { name: "W", completed: 5, total: 5 },
    { name: "T", completed: 2, total: 4 },
    { name: "F", completed: 0, total: 3 },
    { name: "S", completed: 0, total: 0 },
    { name: "S", completed: 0, total: 0 },
  ]

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
    {
      icon: <Clock size={20} className="text-purple-400" />,
      value: stats.avgCompletionTime || 18,
      label: "Avg Time",
      unit: "min",
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

      <div className="px-5 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-cyan-400" />
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">This Week</h2>
        </div>

        <div className="p-5 rounded-2xl bg-[#131720] border border-white/5">
          <div className="flex justify-between gap-2">
            {mockWeekData.map((day, index) => {
              const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0
              return (
                <div key={day.name} className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative w-full h-24 bg-[#1a2332] rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${percentage}%` }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", damping: 15 }}
                      className={`absolute bottom-0 w-full rounded-lg ${
                        percentage === 100
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                          : percentage > 0
                            ? "bg-gradient-to-t from-cyan-600 to-cyan-400"
                            : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{day.name}</span>
                  <span className="text-xs text-slate-600">
                    {day.total > 0 ? `${day.completed}/${day.total}` : "-"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
