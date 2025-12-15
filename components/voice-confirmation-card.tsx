"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, CheckCircle2 } from "lucide-react"

interface ParsedReminder {
  task: string
  date: string | null
  time: string | null
  relative: string | null
}

interface VoiceConfirmationCardProps {
  original: string
  parsed: ParsedReminder
  onConfirm: () => void
  onCancel: () => void
}

export function VoiceConfirmationCard({ original, parsed, onConfirm, onCancel }: VoiceConfirmationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-md"
    >
      <div className="bg-[#1a2332] rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-slate-300 text-sm">I heard:</span>
          </div>
        </div>

        {/* Original transcription */}
        <div className="mb-6 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
          <p className="text-slate-300 text-sm italic leading-relaxed">"{original}"</p>
        </div>

        {/* Task */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Task</label>
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
            <p className="text-white font-medium">{parsed.task}</p>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(parsed.date || parsed.relative) && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Date</label>
              <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/30 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-200 text-sm">{parsed.date || parsed.relative}</span>
              </div>
            </div>
          )}

          {parsed.time && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Time</label>
              <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-slate-200 text-sm">{parsed.time}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-full bg-slate-800/50 text-slate-400 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm
          </button>
        </div>
      </div>
    </motion.div>
  )
}
