"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/stores/app-store"
import { useUserStats } from "@/hooks/use-user-stats"

interface CelebrationConfig {
  emoji: string
  title: string
  subtitle: string
  accentColor: string
  confettiCount: number
  soundEffect?: "pop" | "chime" | "whoosh" | "levelup" | "gentle"
}

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 100
  const randomRotation = Math.random() * 360
  const randomScale = 0.5 + Math.random() * 0.5

  return (
    <motion.div
      initial={{
        y: -20,
        x: `${randomX}vw`,
        rotate: 0,
        opacity: 1,
        scale: randomScale,
      }}
      animate={{
        y: "100vh",
        rotate: randomRotation + 360,
        opacity: 0,
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: "easeOut",
      }}
      className="fixed top-0 w-3 h-3 rounded-sm z-50 pointer-events-none"
      style={{ backgroundColor: color, left: 0 }}
    />
  )
}

function playSound(type: CelebrationConfig["soundEffect"], enabled: boolean) {
  if (!enabled || typeof window === "undefined") return

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "gentle") {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === "levelup") {
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === "chime") {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else {
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    }
  } catch (e) {}
}

function triggerHaptic(enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return
  navigator.vibrate([50, 30, 100])
}

export function CompletionCelebration() {
  const { celebration, dismissCelebration, tasksCompletedToday, preferences } = useAppStore()
  const { stats } = useUserStats()
  const [config, setConfig] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const confettiColors = ["#00d4ff", "#00ff88", "#a78bfa", "#fbbf24", "#f472b6"]
  const streak = stats?.current_streak || 0

  const getCelebrationConfig = useCallback((): any => {
    const { wasQuickWin, wasOverdue, wasFromBreakdown, stepsCompleted, wasPostReset } = celebration

    // POST-RESET: Gentler, encouraging celebrations
    if (wasPostReset) {
      if (tasksCompletedToday === 1) {
        return {
          emoji: "🌱",
          title: "First step!",
          subtitle: "You're back. That's what matters.",
          accentColor: "#10b981",
          confettiCount: 5,
          soundEffect: "gentle",
        }
      }
      if (tasksCompletedToday === 3) {
        return {
          emoji: "🌿",
          title: "Building momentum",
          subtitle: `${tasksCompletedToday} down already. Keep building.`,
          accentColor: "#10b981",
          confettiCount: 8,
          soundEffect: "gentle",
        }
      }
      return {
        emoji: "✨",
        title: "Progress",
        subtitle: `${tasksCompletedToday} tasks completed. One step at a time.`,
        accentColor: "#06b6d4",
        confettiCount: 5,
        soundEffect: "gentle",
      }
    }

    // Milestone celebrations
    if (tasksCompletedToday === 10) {
      return {
        emoji: "🏆",
        title: "10 Tasks Today!",
        subtitle: "You're absolutely crushing it",
        accentColor: "#fbbf24",
        confettiCount: 30,
        soundEffect: "levelup",
      }
    }

    if (streak === 7) {
      return {
        emoji: "🔥",
        title: "Week Streak!",
        subtitle: "7 days of consistent action",
        accentColor: "#f97316",
        confettiCount: 25,
        soundEffect: "levelup",
      }
    }

    if (streak === 30) {
      return {
        emoji: "👑",
        title: "30-Day Streak!",
        subtitle: "You've built a real habit",
        accentColor: "#fbbf24",
        confettiCount: 40,
        soundEffect: "levelup",
      }
    }

    // Context-specific celebrations
    if (wasOverdue) {
      return {
        emoji: "💪",
        title: "Cleared the backlog!",
        subtitle: "That weight is off your shoulders",
        accentColor: "#10b981",
        confettiCount: 15,
        soundEffect: "chime",
      }
    }

    if (wasFromBreakdown && stepsCompleted > 0) {
      return {
        emoji: "🧩",
        title: `${stepsCompleted} steps complete!`,
        subtitle: "You broke through the overwhelm",
        accentColor: "#8b5cf6",
        confettiCount: 12,
        soundEffect: "chime",
      }
    }

    if (wasQuickWin) {
      return {
        emoji: "⚡",
        title: "Quick win!",
        subtitle: "Momentum is building",
        accentColor: "#06b6d4",
        confettiCount: 8,
        soundEffect: "pop",
      }
    }

    if (tasksCompletedToday === 5) {
      return {
        emoji: "🎯",
        title: "5 down!",
        subtitle: "You're in the zone",
        accentColor: "#10b981",
        confettiCount: 15,
        soundEffect: "chime",
      }
    }

    if (tasksCompletedToday === 3) {
      return {
        emoji: "🚀",
        title: "Hat trick!",
        subtitle: "Three tasks knocked out",
        accentColor: "#8b5cf6",
        confettiCount: 10,
        soundEffect: "chime",
      }
    }

    if (tasksCompletedToday === 1) {
      return {
        emoji: "✨",
        title: "First one down!",
        subtitle: "The hardest part is starting",
        accentColor: "#06b6d4",
        confettiCount: 8,
        soundEffect: "pop",
      }
    }

    const defaults: any[] = [
      {
        emoji: "✅",
        title: "Done!",
        subtitle: "One less thing on your mind",
        accentColor: "#10b981",
        confettiCount: 5,
        soundEffect: "pop",
      },
      {
        emoji: "🎉",
        title: "Nice work!",
        subtitle: "Keep the momentum going",
        accentColor: "#8b5cf6",
        confettiCount: 5,
        soundEffect: "pop",
      },
    ]

    return defaults[tasksCompletedToday % defaults.length]
  }, [celebration, tasksCompletedToday, streak])

  useEffect(() => {
    if (!celebration.isVisible) {
      setConfig(null)
      setShowConfetti(false)
      return
    }

    const celebrationConfig = getCelebrationConfig()
    setConfig(celebrationConfig)

    if (preferences.confettiEnabled) {
      setShowConfetti(true)
    }

    playSound(celebrationConfig.soundEffect, preferences.soundEnabled)
    triggerHaptic(preferences.hapticEnabled)

    console.log(
      "[v0] Celebration triggered, will auto-dismiss in",
      celebrationConfig.confettiCount > 15 ? 2500 : 1800,
      "ms",
    )

    const timer = setTimeout(
      () => {
        console.log("[v0] Auto-dismissing celebration")
        dismissCelebration()
      },
      celebrationConfig.confettiCount > 15 ? 2500 : 1800,
    )

    return () => {
      console.log("[v0] Cleaning up celebration timer")
      clearTimeout(timer)
    }
  }, [celebration.isVisible, getCelebrationConfig, dismissCelebration, preferences])

  return (
    <AnimatePresence>
      {celebration.isVisible && config && (
        <>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {Array.from({ length: config.confettiCount }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.05} color={confettiColors[i % confettiColors.length] ?? "#00d4ff"} />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
            onClick={dismissCelebration}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 0.3 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-64 h-64 rounded-full blur-3xl"
              style={{ backgroundColor: config.accentColor }}
            />

            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1,
                }}
                className="text-7xl mb-4"
              >
                {config.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {config.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-slate-300"
              >
                {config.subtitle}
              </motion.p>

              {preferences.showStreak && streak > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10"
                >
                  <span className="text-orange-400">🔥</span>
                  <span className="text-white font-medium">{streak} day streak</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
