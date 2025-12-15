"use client"

import { motion } from "framer-motion"
import { Battery, Clock, Eye } from "lucide-react"
import type { Reasoning } from "@/lib/types"

interface ReasoningCardProps {
  reasoning: Reasoning
}

export function ReasoningCard({ reasoning }: ReasoningCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-sm overflow-hidden"
    >
      <div className="glass-card p-5 space-y-4">
        {/* Energy Match */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent-green/10">
            <Battery className="w-4 h-4 text-accent-green" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary">Energy match</p>
            <p className="text-lg font-semibold text-accent-green">{reasoning.energyMatch}%</p>
          </div>
        </div>

        {/* Priority Reason */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent-orange/10">
            <Clock className="w-4 h-4 text-accent-orange" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary">Priority</p>
            <p className="text-sm text-text-primary leading-relaxed">{reasoning.priorityReason}</p>
          </div>
        </div>

        {/* Context Note */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent-purple/10">
            <Eye className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary">Pattern</p>
            <p className="text-sm text-text-primary leading-relaxed">{reasoning.contextNote}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
