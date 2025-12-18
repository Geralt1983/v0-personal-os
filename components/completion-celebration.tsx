"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CelebrationMessage {
  emoji: string
  title: string
  subtitle: string
}

interface CompletionCelebrationProps {
  isVisible: boolean
  onComplete: () => void
  streak?: number
  tasksCompletedToday?: number
  allHighPriorityDone?: boolean
  isQuickWin?: boolean
}

export function CompletionCelebration({
  isVisible,
  onComplete,
  streak = 0,
  tasksCompletedToday = 1,
  allHighPriorityDone = false,
  isQuickWin = false,
}: CompletionCelebrationProps) {
  const [message, setMessage] = useState<CelebrationMessage | null>(null)

  useEffect(() => {
    if (!isVisible) return

    const messages: CelebrationMessage[] = []

    if (allHighPriorityDone) {
      messages.push({
        emoji: "🎯",
        title: "All high-priority done!",
        subtitle: "You crushed the important stuff",
      })
    }

    if (tasksCompletedToday >= 5) {
      messages.push({
        emoji: "🔥",
        title: `${tasksCompletedToday} tasks today!`,
        subtitle: "You're on fire",
      })
    } else if (tasksCompletedToday === 3) {
      messages.push({
        emoji: "⚡",
        title: "3 tasks before noon!",
        subtitle: "Momentum is building",
      })
    }

    if (streak >= 7) {
      messages.push({
        emoji: "🏆",
        title: `${streak}-day streak!`,
        subtitle: "Consistency is your superpower",
      })
    } else if (streak >= 3) {
      messages.push({
        emoji: "🔥",
        title: `${streak} days in a row!`,
        subtitle: "Keep the streak alive",
      })
    }

    if (isQuickWin) {
      messages.push({
        emoji: "⚡",
        title: "Quick win!",
        subtitle: "Small wins add up",
      })
    }

    if (messages.length === 0) {
      const defaults: CelebrationMessage[] = [
        { emoji: "✨", title: "Nice work!", subtitle: "One less thing to worry about" },
        { emoji: "💪", title: "Done!", subtitle: "Progress feels good" },
        { emoji: "🎉", title: "Completed!", subtitle: "Onward and upward" },
        { emoji: "✅", title: "Checked off!", subtitle: "That's how it's done" },
      ]
      messages.push(defaults[Math.floor(Math.random() * defaults.length)])
    }

    setMessage(messages[0])

    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5 }}
              className="text-7xl mb-4"
            >
              {message.emoji}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {message.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400"
            >
              {message.subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
