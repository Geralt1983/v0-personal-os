"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, SlidersHorizontal, Brain, Play, Pause, Check, Flame, Zap, Plus, Sparkles } from "lucide-react"
import { ReasoningCard } from "./reasoning-card"
import { AiDialogueModal } from "./ai-dialogue-modal"
import { MenuDrawer } from "./menu-drawer"
import { SessionControls } from "./session-controls"
import { TimerEditModal } from "./timer-edit-modal"
import { StatModal } from "./stat-modal"
import { PlanProgressBar } from "./plan-progress-bar"
import type { Task, Reasoning, UserStats } from "@/lib/types"

// Ambient floating particles component
function AmbientParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 300 + 100,
            height: Math.random() * 300 + 100,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(191, 127, 255, 0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

interface PlanProgress {
  completed: number
  total: number
  elapsedMinutes: number
  remainingMinutes: number
  percentage: number
}

interface SingleTaskViewProps {
  task: Task
  reasoning: Reasoning
  stats: UserStats
  planProgress?: PlanProgress
  onComplete: () => void
  onCantDo: () => void
  onNavigate?: (view: "task" | "dashboard" | "settings" | "taskList" | "habits") => void
  onAddTask?: () => void
}

export function SingleTaskView({
  task,
  reasoning,
  stats,
  planProgress,
  onComplete,
  onNavigate,
  onAddTask,
}: SingleTaskViewProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showMenuDrawer, setShowMenuDrawer] = useState(false)
  const [showSessionControls, setShowSessionControls] = useState(false)
  const [showTimerEdit, setShowTimerEdit] = useState(false)
  const [showStatModal, setShowStatModal] = useState<"streak" | "trust" | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(task.estimatedMinutes * 60)
  const [isCompleting, setIsCompleting] = useState(false)
  const [defaultTimerMinutes, setDefaultTimerMinutes] = useState(25)

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false)
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Timer Complete!", {
                body: `Time's up for: ${task.title}`,
                icon: "/favicon.ico",
              })
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerRunning, timeLeft, task.title])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return { mins: mins.toString().padStart(2, "0"), secs: secs.toString().padStart(2, "0") }
  }

  const handleComplete = useCallback(() => {
    setIsCompleting(true)
    setTimeout(() => {
      onComplete()
      setIsCompleting(false)
      setTimeLeft(defaultTimerMinutes * 60)
      setTimerRunning(false)
    }, 800)
  }, [onComplete, defaultTimerMinutes])

  const handleTimerSave = (minutes: number) => {
    setTimeLeft(minutes * 60)
    setDefaultTimerMinutes(minutes)
  }

  const handleNavigate = (view: "task" | "dashboard" | "settings" | "taskList" | "habits") => {
    console.log("[v0] SingleTaskView handleNavigate:", view)
    setShowMenuDrawer(false)
    if (onNavigate) {
      onNavigate(view)
    }
  }

  const handleAddTask = () => {
    console.log("[v0] SingleTaskView handleAddTask called")
    setShowMenuDrawer(false)
    if (onAddTask) {
      onAddTask()
    }
  }

  const time = formatTime(timeLeft)

  const progressPercent = ((defaultTimerMinutes * 60 - timeLeft) / (defaultTimerMinutes * 60)) * 100

  return (
    <>
      <AmbientParticles />
      <div className="min-h-screen flex flex-col px-6 py-6 relative z-10">
        {/* Premium Header */}
        <header className="flex items-center justify-between mb-10">
          <motion.button
            onClick={() => setShowMenuDrawer(true)}
            className="p-3 rounded-2xl glass-card-sm hover:border-white/20 transition-all duration-300"
            aria-label="Menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </motion.button>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleAddTask}
              className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300"
              aria-label="Add Task"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-emerald-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowSessionControls(true)}
              className="p-3 rounded-2xl glass-card-sm hover:border-white/20 transition-all duration-300"
              aria-label="Session Controls"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SlidersHorizontal className="w-5 h-5 text-text-secondary" />
            </motion.button>
          </div>
        </header>

        {/* Plan Progress Bar */}
        {planProgress && planProgress.total > 0 && (
          <PlanProgressBar
            completed={planProgress.completed}
            total={planProgress.total}
            elapsedMinutes={planProgress.elapsedMinutes}
            remainingMinutes={planProgress.remainingMinutes}
            percentage={planProgress.percentage}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-8">
          {/* Premium Next Action Label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5 mb-8 px-5 py-2.5 rounded-full glass-card-sm border-accent-cyan/20"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 text-accent-cyan" />
            </motion.div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-cyan">Focus Mode</span>
          </motion.div>

          {/* Task Title with Premium Typography */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: isCompleting ? 0 : 1, scale: isCompleting ? 0.95 : 1, y: isCompleting ? -20 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-balance leading-[1.2] mb-8 px-4 max-w-xl bg-gradient-to-b from-white to-white/80 bg-clip-text"
          >
            {task.title}
          </motion.h1>

          {/* Why This Task Button - Enhanced */}
          <motion.button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card-sm mb-6 group border-transparent hover:border-accent-purple/30 transition-all duration-300"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Brain className="w-4 h-4 text-accent-purple group-hover:text-accent-purple-light transition-colors" />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              Why this task?
            </span>
          </motion.button>

          {/* Reasoning Card */}
          <AnimatePresence>{showReasoning && <ReasoningCard reasoning={reasoning} />}</AnimatePresence>

          {/* Premium Timer Display */}
          <motion.button
            onClick={() => setShowTimerEdit(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 mb-4 relative group"
          >
            {/* Timer Ring Progress */}
            <div className="absolute -inset-6 rounded-full opacity-50">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * progressPercent) / 100}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#bf7fff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="relative">
              <p className="font-mono text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-gradient-primary">{time.mins}</span>
                <motion.span
                  className="text-white/20"
                  animate={{ opacity: timerRunning ? [1, 0.3, 1] : 1 }}
                  transition={{ duration: 1, repeat: timerRunning ? Infinity : 0 }}
                >:</motion.span>
                <span className="text-white/60">{time.secs}</span>
              </p>
            </div>
          </motion.button>

          {/* Timer Control Button - Premium */}
          <motion.button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full mb-10 transition-all duration-300 ${
              timerRunning
                ? 'glass-card-sm border-accent-cyan/30 text-accent-cyan'
                : 'glass-card-sm text-text-secondary hover:text-text-primary hover:border-white/20'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm font-medium">{timerRunning ? "Pause Timer" : "Start Timer"}</span>
          </motion.button>

          {/* Premium Complete Button */}
          <motion.button
            onClick={handleComplete}
            className="w-full max-w-sm py-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-black font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden btn-premium"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={isCompleting}
            style={{
              boxShadow: "0 0 40px rgba(52, 211, 153, 0.35), 0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ width: '50%' }}
            />
            <Check className="w-6 h-6 relative z-10" strokeWidth={3} />
            <span className="relative z-10">Complete Task</span>
          </motion.button>

          {/* Can't Do Button - Subtle */}
          <motion.button
            onClick={() => setShowAiDialog(true)}
            className="mt-5 px-6 py-3 text-text-tertiary hover:text-text-secondary transition-all duration-300 text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Need help with this?
          </motion.button>
        </div>

        {/* Premium Footer Stats */}
        <footer className="flex items-center justify-center gap-6 pt-6">
          <motion.button
            onClick={() => setShowStatModal("streak")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card-sm hover:border-accent-orange/30 transition-all duration-300"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20">
              <Flame className="w-5 h-5 text-accent-orange" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white">{stats.currentStreak}</p>
              <p className="text-xs text-text-tertiary">Day Streak</p>
            </div>
          </motion.button>
          <motion.button
            onClick={() => setShowStatModal("trust")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card-sm hover:border-accent-cyan/30 transition-all duration-300"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
              <Zap className="w-5 h-5 text-accent-cyan" fill="currentColor" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white">{stats.trustScore}%</p>
              <p className="text-xs text-text-tertiary">Trust Score</p>
            </div>
          </motion.button>
        </footer>
      </div>

      {/* Modals */}
      <MenuDrawer
        isOpen={showMenuDrawer}
        onClose={() => setShowMenuDrawer(false)}
        onNavigate={handleNavigate}
        onAddTask={handleAddTask}
      />

      <SessionControls isOpen={showSessionControls} onClose={() => setShowSessionControls(false)} />

      <TimerEditModal
        isOpen={showTimerEdit}
        onClose={() => setShowTimerEdit(false)}
        currentMinutes={Math.ceil(timeLeft / 60)}
        onSave={handleTimerSave}
      />

      <StatModal
        isOpen={showStatModal !== null}
        onClose={() => setShowStatModal(null)}
        type={showStatModal || "streak"}
        currentStreak={stats.currentStreak}
        trustScore={stats.trustScore}
      />

      <AnimatePresence>
        {showAiDialog && (
          <AiDialogueModal
            task={task}
            onClose={() => setShowAiDialog(false)}
            onSelectSubtask={() => {
              setShowAiDialog(false)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
