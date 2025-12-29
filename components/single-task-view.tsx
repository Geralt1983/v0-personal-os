"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, SlidersHorizontal, Brain, Play, Pause, Check, Flame, Zap, Plus } from "lucide-react"
import { ReasoningCard } from "./reasoning-card"
import { AiDialogueModal } from "./ai-dialogue-modal"
import { MenuDrawer } from "./menu-drawer"
import { SessionControls } from "./session-controls"
import { TimerEditModal } from "./timer-edit-modal"
import { StatModal } from "./stat-modal"
import type { Task, Reasoning, UserStats } from "@/lib/types"

interface SingleTaskViewProps {
  task: Task
  reasoning: Reasoning
  stats: UserStats
  onComplete: () => void
  onCantDo: () => void
  onNavigate?: (view: "task" | "dashboard" | "settings" | "taskList" | "habits") => void
  onAddTask?: () => void
}

export function SingleTaskView({
  task,
  reasoning,
  stats,
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

  return (
    <>
      <div className="min-h-screen flex flex-col px-6 py-6">
        <header className="flex items-center justify-between mb-10">
          <button onClick={() => setShowMenuDrawer(true)} className="p-3 rounded-full glass-card-sm" aria-label="Menu">
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddTask}
              className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"
              aria-label="Add Task"
            >
              <Plus className="w-5 h-5 text-emerald-400" />
            </button>
            <button
              onClick={() => setShowSessionControls(true)}
              className="p-3 rounded-full glass-card-sm"
              aria-label="Session Controls"
            >
              <SlidersHorizontal className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-12">
          {/* Next Action Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <Zap className="w-4 h-4 text-accent-cyan" fill="currentColor" />
            <span className="text-xs font-medium tracking-widest uppercase text-accent-cyan">Next Action</span>
          </motion.div>

          {/* Task Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isCompleting ? 0 : 1, scale: isCompleting ? 0.9 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-balance leading-tight mb-6 px-4 max-w-lg"
          >
            {task.title}
          </motion.h1>

          {/* Why This Task Button */}
          <motion.button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card-sm mb-4 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Brain className="w-4 h-4 text-accent-purple group-hover:text-accent-cyan transition-colors" />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              Why this task?
            </span>
          </motion.button>

          {/* Reasoning Card */}
          <AnimatePresence>{showReasoning && <ReasoningCard reasoning={reasoning} />}</AnimatePresence>

          <motion.button
            onClick={() => setShowTimerEdit(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 mb-3 hover:scale-105 transition-transform"
          >
            <p className="font-mono text-5xl md:text-6xl font-bold">
              <span className="text-accent-cyan">{time.mins}</span>
              <span className="text-slate-600">:{time.secs}</span>
            </p>
          </motion.button>

          <motion.button
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">{timerRunning ? "Pause" : "Start"}</span>
          </motion.button>

          <motion.button
            onClick={handleComplete}
            className="w-full max-w-sm py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-bg-base font-semibold text-lg flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(52, 211, 153, 0.4)" }}
            whileTap={{ scale: 0.97 }}
            disabled={isCompleting}
            style={{ boxShadow: "0 0 16px rgba(52, 211, 153, 0.25)" }}
          >
            <Check className="w-5 h-5" />
            Complete Task
          </motion.button>

          <motion.button
            onClick={() => setShowAiDialog(true)}
            className="mt-4 px-6 py-3 text-slate-500 hover:text-slate-400 transition-colors text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Can't do this now
          </motion.button>
        </div>

        <footer className="flex items-center justify-center gap-8 pt-6">
          <button
            onClick={() => setShowStatModal("streak")}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Flame className="w-5 h-5 text-accent-orange" />
            <span className="text-sm">
              <span className="font-bold">{stats.currentStreak} days</span>{" "}
              <span className="text-text-tertiary">Streak</span>
            </span>
          </button>
          <button
            onClick={() => setShowStatModal("trust")}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Zap className="w-5 h-5 text-accent-cyan" fill="currentColor" />
            <span className="text-sm">
              <span className="font-bold">{stats.trustScore}%</span>{" "}
              <span className="text-text-tertiary">Trust Score</span>
            </span>
          </button>
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
