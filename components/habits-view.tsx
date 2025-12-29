"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Check, Flame, Trophy, MoreVertical, Trash2, Archive, X } from "lucide-react"
import { useHabits } from "@/hooks/use-habits"
import type { HabitWithStats } from "@/lib/habits/types"

interface HabitsViewProps {
  onBack: () => void
}

export function HabitsView({ onBack }: HabitsViewProps) {
  const { habits, loading, completeHabit, createHabit, deleteHabit, archiveHabit } = useHabits()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState("")
  const [newHabitIcon, setNewHabitIcon] = useState("🎯")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleComplete = async (habitId: string) => {
    await completeHabit(habitId)
  }

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return
    await createHabit({
      title: newHabitTitle,
      icon: newHabitIcon,
      frequency: { type: "daily" },
    })
    setNewHabitTitle("")
    setNewHabitIcon("🎯")
    setShowAddForm(false)
  }

  const handleDelete = async (id: string) => {
    await deleteHabit(id)
    setMenuOpenId(null)
  }

  const handleArchive = async (id: string) => {
    await archiveHabit(id)
    setMenuOpenId(null)
  }

  const completedToday = habits.filter((h) => h.completedToday).length
  const totalHabits = habits.length

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0a0f16]/95 backdrop-blur-lg z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Habits</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 transition-colors"
        >
          <Plus size={20} className="text-violet-400" />
        </button>
      </header>

      {/* Stats Bar */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-400">
              {completedToday}/{totalHabits}
            </div>
            <div className="text-xs text-slate-400">Today</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold text-orange-400">
                {Math.max(...habits.map((h) => h.streak_current), 0)}
              </span>
            </div>
            <div className="text-xs text-slate-400">Best Streak</div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="px-5 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-slate-400 mb-4">No habits yet. Start building good habits!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-full bg-violet-500 text-white font-medium"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={() => handleComplete(habit.id)}
              menuOpen={menuOpenId === habit.id}
              onMenuToggle={() => setMenuOpenId(menuOpenId === habit.id ? null : habit.id)}
              onDelete={() => handleDelete(habit.id)}
              onArchive={() => handleArchive(habit.id)}
            />
          ))
        )}
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-slate-800 rounded-2xl p-6 z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">New Habit</h2>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-700 rounded-full">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const icons = ["🎯", "💪", "📚", "🧘", "🏃", "💧", "🌅", "✍️", "🎨", "🎵"]
                      const currentIndex = icons.indexOf(newHabitIcon)
                      setNewHabitIcon(icons[(currentIndex + 1) % icons.length] ?? "🎯")
                    }}
                    className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-2xl hover:bg-slate-600 transition-colors"
                  >
                    {newHabitIcon}
                  </button>
                  <input
                    type="text"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="Habit name..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitTitle.trim()}
                  className="w-full py-3 rounded-xl bg-violet-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-600 transition-colors"
                >
                  Create Habit
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function HabitCard({
  habit,
  onComplete,
  menuOpen,
  onMenuToggle,
  onDelete,
  onArchive,
}: {
  habit: HabitWithStats
  onComplete: () => void
  menuOpen: boolean
  onMenuToggle: () => void
  onDelete: () => void
  onArchive: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-800/50 rounded-xl p-4 border border-white/5"
    >
      <div className="flex items-center gap-4">
        {/* Complete Button */}
        <button
          onClick={onComplete}
          disabled={habit.completedToday}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
            habit.completedToday
              ? "bg-emerald-500/20 border-2 border-emerald-500"
              : "bg-slate-700 hover:bg-slate-600 border-2 border-transparent"
          }`}
        >
          {habit.completedToday ? <Check className="w-6 h-6 text-emerald-400" /> : habit.icon}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${habit.completedToday ? "text-slate-400 line-through" : "text-white"}`}>
            {habit.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            {habit.streak_current > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-400">
                <Flame className="w-3 h-3" />
                {habit.streak_current} day streak
              </span>
            )}
            {habit.streak_best > 0 && habit.streak_best === habit.streak_current && habit.streak_current >= 7 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Trophy className="w-3 h-3" />
                Best!
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button onClick={onMenuToggle} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <MoreVertical size={18} className="text-slate-400" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-36 bg-slate-700 rounded-lg shadow-lg overflow-hidden z-10"
              >
                <button
                  onClick={onArchive}
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-600 flex items-center gap-2"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button
                  onClick={onDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-600 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
