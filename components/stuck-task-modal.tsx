"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Scissors, Users, HelpCircle, Trash2, Sparkles } from "lucide-react"

interface StuckTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: { id: string; title: string }
  skipCount: number
  onBreakDown: () => void
  onDelegate: () => void
  onHireOut: () => void
  onDelete: () => void
  onKeep: (reason: string) => void
}

export function StuckTaskModal({
  isOpen,
  onClose,
  task,
  skipCount,
  onBreakDown,
  onDelegate,
  onHireOut,
  onDelete,
  onKeep,
}: StuckTaskModalProps) {
  const [showBlockerInput, setShowBlockerInput] = useState(false)
  const [blockerReason, setBlockerReason] = useState("")

  const handleKeep = () => {
    onKeep(blockerReason)
    setBlockerReason("")
    setShowBlockerInput(false)
    onClose()
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-[#131720] rounded-3xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">This task seems stuck</h2>
                      <p className="text-sm text-slate-400">Skipped {skipCount} times</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Task Title */}
              <div className="px-6 py-4 bg-white/5">
                <p className="text-white font-medium">{task.title}</p>
              </div>

              {/* Options */}
              <div className="p-6 space-y-3">
                <p className="text-sm text-slate-400 mb-4">What would help you move forward?</p>

                <button
                  onClick={onBreakDown}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Break it down</p>
                    <p className="text-sm text-slate-400">AI will create smaller steps</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-400 ml-auto" />
                </button>

                <button
                  onClick={onDelegate}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Delegate it</p>
                    <p className="text-sm text-slate-400">Hand off to someone else</p>
                  </div>
                </button>

                <button
                  onClick={onHireOut}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Hire it out</p>
                    <p className="text-sm text-slate-400">Pay someone to handle it</p>
                  </div>
                </button>

                {!showBlockerInput ? (
                  <button
                    onClick={() => setShowBlockerInput(true)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-lg">🤔</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Keep it, but tell me what's blocking you</p>
                      <p className="text-sm text-slate-400">I'll remember for next time</p>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <p className="text-sm text-slate-300">What's blocking you?</p>
                    <textarea
                      value={blockerReason}
                      onChange={(e) => setBlockerReason(e.target.value)}
                      placeholder="e.g., Waiting for info from client..."
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0f16] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBlockerInput(false)}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-slate-400 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleKeep}
                        className="flex-1 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium"
                      >
                        Save & Keep
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={onDelete}
                  className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Delete this task</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
