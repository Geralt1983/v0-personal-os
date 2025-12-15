"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Flame, TrendingUp, Calendar } from "lucide-react"

interface StatModalProps {
  isOpen: boolean
  onClose: () => void
  type: "streak" | "trust"
  currentStreak: number
  trustScore: number
}

export function StatModal({ isOpen, onClose, type, currentStreak, trustScore }: StatModalProps) {
  const streakHistory = [
    { date: "Mon", count: 1 },
    { date: "Tue", count: 1 },
    { date: "Wed", count: 1 },
    { date: "Thu", count: 1 },
    { date: "Fri", count: 1 },
    { date: "Sat", count: 1 },
    { date: "Sun", count: 1 },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-md"
          >
            <div className="glass-card rounded-t-3xl md:rounded-3xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {type === "streak" ? (
                    <>
                      <Flame className="w-6 h-6 text-accent-orange" />
                      Streak
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-6 h-6 text-accent-cyan" />
                      Trust Score
                    </>
                  )}
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {type === "streak" ? (
                <>
                  {/* Current Streak */}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-accent-orange mb-2">{currentStreak}</div>
                    <p className="text-slate-400">days in a row</p>
                  </div>

                  {/* Streak History */}
                  <div className="space-y-3">
                    <h3 className="text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last 7 Days
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {streakHistory.map((day, i) => (
                        <div key={i} className="text-center">
                          <div className="w-full aspect-square rounded-lg bg-accent-orange/20 border border-accent-orange/30 flex items-center justify-center mb-1">
                            <Flame className="w-4 h-4 text-accent-orange" />
                          </div>
                          <p className="text-xs text-slate-500">{day.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Current Trust Score */}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-accent-cyan mb-2">{trustScore}%</div>
                    <p className="text-slate-400">reliability score</p>
                  </div>

                  {/* Trust Score Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm text-slate-400">How it's calculated</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Completion rate</span>
                          <span className="text-accent-cyan font-semibold">92%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            className="h-full bg-accent-cyan"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">On-time delivery</span>
                          <span className="text-accent-purple font-semibold">85%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "85%" }}
                            className="h-full bg-accent-purple"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Follow-through</span>
                          <span className="text-accent-green font-semibold">84%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "84%" }}
                            className="h-full bg-accent-green"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
