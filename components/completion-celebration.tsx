"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/stores/app-store"
import { useUserStats } from "@/hooks/use-user-stats"
import { Sparkles, Star, Zap, Trophy, Flame, Crown } from "lucide-react"

interface CelebrationConfig {
  emoji: string
  title: string
  subtitle: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
  confettiCount: number
  xpGained: number
  soundEffect?: "pop" | "chime" | "whoosh" | "levelup" | "gentle" | "epic"
  intensity: "subtle" | "normal" | "epic"
  icon?: React.ReactNode
}

// Premium confetti shapes
function ConfettiParticle({ delay, color, shape }: { delay: number; color: string; shape: "square" | "circle" | "star" | "triangle" }) {
  const randomX = Math.random() * 100
  const randomRotation = Math.random() * 720 - 360
  const randomScale = 0.4 + Math.random() * 0.6
  const randomDrift = (Math.random() - 0.5) * 200

  const shapeStyles = {
    square: "rounded-sm",
    circle: "rounded-full",
    star: "rotate-45",
    triangle: "",
  }

  return (
    <motion.div
      initial={{
        y: -20,
        x: `${randomX}vw`,
        rotate: 0,
        opacity: 1,
        scale: 0,
      }}
      animate={{
        y: "110vh",
        x: `calc(${randomX}vw + ${randomDrift}px)`,
        rotate: randomRotation,
        opacity: [1, 1, 0],
        scale: [0, randomScale, randomScale],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`fixed top-0 pointer-events-none z-[60] ${shapeStyles[shape]}`}
      style={{
        width: shape === "star" ? 12 : 10,
        height: shape === "star" ? 12 : 10,
        backgroundColor: color,
        left: 0,
        boxShadow: `0 0 10px ${color}80`,
        ...(shape === "triangle" && {
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: `10px solid ${color}`,
        }),
      }}
    />
  )
}

// Ring burst animation
function RingBurst({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ width: 40, height: 40, opacity: 0.8 }}
          animate={{
            width: [40, 300],
            height: [40, 300],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1,
            delay: delay + i * 0.15,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  )
}

// Sparkle burst effect
function SparkleBurst({ count = 8, color }: { count?: number; color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360
        const distance = 80 + Math.random() * 40
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: 0.1 + i * 0.02,
              ease: "easeOut",
            }}
          >
            <Star className="w-4 h-4" style={{ color, fill: color }} />
          </motion.div>
        )
      })}
    </div>
  )
}

function playSound(type: CelebrationConfig["soundEffect"], enabled: boolean) {
  if (!enabled || typeof window === "undefined") return

  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "epic") {
      // Epic multi-tone celebration
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3)
        o.start(ctx.currentTime + i * 0.1)
        o.stop(ctx.currentTime + i * 0.1 + 0.3)
      })
      return
    }

    if (type === "gentle") {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === "levelup") {
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === "chime") {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else {
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    }
  } catch {
    // Audio context not available
  }
}

function triggerHaptic(intensity: CelebrationConfig["intensity"], enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return

  const patterns = {
    subtle: [30],
    normal: [50, 30, 80],
    epic: [50, 30, 100, 30, 150],
  }
  navigator.vibrate(patterns[intensity])
}

export function CompletionCelebration() {
  const { celebration, dismissCelebration, tasksCompletedToday, preferences } = useAppStore()
  const { stats } = useUserStats()
  const [config, setConfig] = useState<CelebrationConfig | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const confettiColors = ["#00e5ff", "#00f593", "#bf7fff", "#ffd700", "#ff6b6b", "#5ffbb8"]
  const shapes: Array<"square" | "circle" | "star" | "triangle"> = ["square", "circle", "star", "triangle"]
  const streak = stats?.current_streak || 0

  const getCelebrationConfig = useCallback((): CelebrationConfig => {
    const { wasQuickWin, wasOverdue, wasFromBreakdown, stepsCompleted, wasPostReset } = celebration

    // POST-RESET: Gentler, encouraging celebrations
    if (wasPostReset) {
      if (tasksCompletedToday === 1) {
        return {
          emoji: "🌱",
          title: "Welcome back",
          subtitle: "The first step is always the bravest",
          accentColor: "#10b981",
          gradientFrom: "#10b981",
          gradientTo: "#059669",
          confettiCount: 8,
          xpGained: 15,
          soundEffect: "gentle",
          intensity: "subtle",
          icon: <Sparkles className="w-6 h-6" />,
        }
      }
      return {
        emoji: "✨",
        title: "Building momentum",
        subtitle: `${tasksCompletedToday} tasks down. You've got this.`,
        accentColor: "#06b6d4",
        gradientFrom: "#06b6d4",
        gradientTo: "#0891b2",
        confettiCount: 10,
        xpGained: 20,
        soundEffect: "gentle",
        intensity: "subtle",
        icon: <Zap className="w-6 h-6" />,
      }
    }

    // Epic milestone celebrations
    if (tasksCompletedToday === 10) {
      return {
        emoji: "🏆",
        title: "Legendary!",
        subtitle: "10 tasks conquered today",
        accentColor: "#ffd700",
        gradientFrom: "#ffd700",
        gradientTo: "#f59e0b",
        confettiCount: 50,
        xpGained: 200,
        soundEffect: "epic",
        intensity: "epic",
        icon: <Trophy className="w-8 h-8" />,
      }
    }

    if (streak === 7) {
      return {
        emoji: "🔥",
        title: "Week Warrior!",
        subtitle: "7 days of unstoppable progress",
        accentColor: "#f97316",
        gradientFrom: "#f97316",
        gradientTo: "#ea580c",
        confettiCount: 40,
        xpGained: 150,
        soundEffect: "epic",
        intensity: "epic",
        icon: <Flame className="w-8 h-8" />,
      }
    }

    if (streak === 30) {
      return {
        emoji: "👑",
        title: "30-Day Legend!",
        subtitle: "You've mastered consistency",
        accentColor: "#ffd700",
        gradientFrom: "#ffd700",
        gradientTo: "#d97706",
        confettiCount: 60,
        xpGained: 500,
        soundEffect: "epic",
        intensity: "epic",
        icon: <Crown className="w-8 h-8" />,
      }
    }

    // Context-specific celebrations
    if (wasOverdue) {
      return {
        emoji: "💪",
        title: "Backlog cleared!",
        subtitle: "That weight is lifted",
        accentColor: "#10b981",
        gradientFrom: "#10b981",
        gradientTo: "#059669",
        confettiCount: 25,
        xpGained: 50,
        soundEffect: "chime",
        intensity: "normal",
      }
    }

    if (wasFromBreakdown && stepsCompleted > 0) {
      return {
        emoji: "🧩",
        title: `${stepsCompleted} steps done!`,
        subtitle: "Complexity conquered",
        accentColor: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#7c3aed",
        confettiCount: 20,
        xpGained: 40,
        soundEffect: "chime",
        intensity: "normal",
      }
    }

    if (wasQuickWin) {
      return {
        emoji: "⚡",
        title: "Quick win!",
        subtitle: "Speed and precision",
        accentColor: "#00e5ff",
        gradientFrom: "#00e5ff",
        gradientTo: "#0891b2",
        confettiCount: 15,
        xpGained: 25,
        soundEffect: "pop",
        intensity: "normal",
        icon: <Zap className="w-6 h-6" />,
      }
    }

    if (tasksCompletedToday === 5) {
      return {
        emoji: "🎯",
        title: "High five!",
        subtitle: "5 tasks in the books",
        accentColor: "#10b981",
        gradientFrom: "#10b981",
        gradientTo: "#059669",
        confettiCount: 25,
        xpGained: 75,
        soundEffect: "levelup",
        intensity: "normal",
      }
    }

    if (tasksCompletedToday === 3) {
      return {
        emoji: "🚀",
        title: "Hat trick!",
        subtitle: "Three and counting",
        accentColor: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#7c3aed",
        confettiCount: 18,
        xpGained: 45,
        soundEffect: "chime",
        intensity: "normal",
      }
    }

    if (tasksCompletedToday === 1) {
      return {
        emoji: "✨",
        title: "First blood!",
        subtitle: "The journey begins",
        accentColor: "#00e5ff",
        gradientFrom: "#00e5ff",
        gradientTo: "#0891b2",
        confettiCount: 12,
        xpGained: 20,
        soundEffect: "pop",
        intensity: "normal",
        icon: <Sparkles className="w-6 h-6" />,
      }
    }

    // Default celebrations
    const defaults: CelebrationConfig[] = [
      {
        emoji: "✅",
        title: "Done!",
        subtitle: "One less thing on your plate",
        accentColor: "#10b981",
        gradientFrom: "#10b981",
        gradientTo: "#059669",
        confettiCount: 8,
        xpGained: 15,
        soundEffect: "pop",
        intensity: "subtle",
      },
      {
        emoji: "🎉",
        title: "Nice!",
        subtitle: "Keep it rolling",
        accentColor: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#7c3aed",
        confettiCount: 10,
        xpGained: 15,
        soundEffect: "pop",
        intensity: "subtle",
      },
    ]

    return defaults[tasksCompletedToday % defaults.length] as CelebrationConfig
  }, [celebration, tasksCompletedToday, streak])

  const confettiParticles = useMemo(() => {
    if (!config) return []
    return Array.from({ length: config.confettiCount }).map((_, i) => ({
      key: i,
      delay: i * 0.03,
      color: confettiColors[i % confettiColors.length] ?? "#00e5ff",
      shape: shapes[i % shapes.length] ?? "square",
    }))
  }, [config?.confettiCount])

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
    triggerHaptic(celebrationConfig.intensity, preferences.hapticEnabled)

    const duration = celebrationConfig.intensity === "epic" ? 3500 : celebrationConfig.intensity === "normal" ? 2200 : 1800

    const timer = setTimeout(() => {
      dismissCelebration()
    }, duration)

    return () => clearTimeout(timer)
  }, [celebration.isVisible, getCelebrationConfig, dismissCelebration, preferences])

  return (
    <AnimatePresence>
      {celebration.isVisible && config && (
        <>
          {/* Premium Confetti */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
              {confettiParticles.map((particle) => (
                <ConfettiParticle
                  key={particle.key}
                  delay={particle.delay}
                  color={particle.color}
                  shape={particle.shape}
                />
              ))}
            </div>
          )}

          {/* Celebration Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
            onClick={dismissCelebration}
          >
            {/* Ambient background glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 0.4 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-64 h-64 rounded-full blur-[100px]"
              style={{
                background: `radial-gradient(circle, ${config.accentColor} 0%, transparent 70%)`,
              }}
            />

            {/* Ring burst for epic celebrations */}
            {config.intensity === "epic" && <RingBurst color={config.accentColor} />}

            {/* Sparkle burst */}
            {config.intensity !== "subtle" && <SparkleBurst color={config.accentColor} count={config.intensity === "epic" ? 12 : 8} />}

            {/* Main content */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="text-center relative z-10"
            >
              {/* Emoji with glow */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  delay: 0.1,
                }}
                className="relative inline-block"
              >
                <motion.div
                  className="absolute inset-0 blur-xl opacity-50"
                  style={{ background: config.accentColor }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-8xl relative block">{config.emoji}</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-4xl font-bold text-white mb-3 mt-6"
                style={{
                  textShadow: `0 0 40px ${config.accentColor}60`,
                }}
              >
                {config.title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-lg text-white/70 mb-6"
              >
                {config.subtitle}
              </motion.p>

              {/* XP Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 400 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${config.gradientFrom}30 0%, ${config.gradientTo}30 100%)`,
                  border: `1px solid ${config.accentColor}50`,
                  boxShadow: `0 0 30px ${config.accentColor}30`,
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: config.accentColor }} />
                </motion.span>
                <span className="text-white font-bold text-lg">+{config.xpGained} XP</span>
              </motion.div>

              {/* Streak badge */}
              {preferences.showStreak && streak > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30"
                >
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-semibold">{streak} day streak</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
