"use client"

import { useState, useEffect } from "react"
import { SingleTaskView } from "@/components/single-task-view"
import { WarRoomDashboard } from "@/components/war-room-dashboard"
import { CommandPalette } from "@/components/command-palette"
import { VoiceReminderScreen } from "@/components/voice-reminder-screen"
import { Mic, Menu, Plus, ListTodo } from "lucide-react"
import { motion } from "framer-motion"
import { TaskListView } from "@/components/task-list-view"
import { AddTaskForm } from "@/components/add-task-form"
import { SettingsScreen } from "@/components/settings-screen"
import { MenuDrawer } from "@/components/menu-drawer"
import type { Task } from "@/hooks/use-tasks"

type View = "task" | "dashboard" | "settings" | "taskList"

const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    user_id: "demo-user",
    title: "Review quarterly report",
    description: "Go through the Q4 financials",
    priority: "high",
    energy_level: "peak",
    estimated_minutes: 45,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    completed: false,
    skipped: false,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-user",
    title: "Schedule dentist appointment",
    description: "Call Dr. Smith's office",
    priority: "medium",
    energy_level: "low",
    estimated_minutes: 10,
    deadline: new Date(Date.now() + 172800000).toISOString(),
    completed: false,
    skipped: false,
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo-user",
    title: "Fix leaky faucet",
    description: "Kitchen sink has been dripping",
    priority: "low",
    energy_level: "medium",
    estimated_minutes: 30,
    deadline: undefined,
    completed: false,
    skipped: false,
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function DemoMode() {
  const [view, setView] = useState<View>("task")
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [voiceReminderOpen, setVoiceReminderOpen] = useState(false)
  const [addTaskFormOpen, setAddTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS)
  const [stats, setStats] = useState({ current_streak: 7, trust_score: 82 })

  const pendingTasks = tasks.filter((t) => !t.completed && !t.skipped)
  const currentTask = pendingTasks[0] || null

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleComplete = () => {
    if (!currentTask) return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === currentTask.id ? { ...t, completed: true, completed_at: new Date().toISOString() } : t,
      ),
    )
    setStats((prev) => ({
      current_streak: prev.current_streak + 1,
      trust_score: Math.min(100, prev.trust_score + 2),
    }))
  }

  const handleCantDo = (reason?: string) => {
    if (!currentTask) return
    setTasks((prev) => prev.map((t) => (t.id === currentTask.id ? { ...t, skipped: true, skip_reason: reason } : t)))
  }

  const handleAddTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `demo-${Date.now()}`,
      user_id: "demo-user",
      title: taskData.title || "New Task",
      description: taskData.description,
      priority: taskData.priority || "medium",
      energy_level: taskData.energy_level || "medium",
      estimated_minutes: taskData.estimated_minutes || 25,
      deadline: taskData.deadline,
      completed: false,
      skipped: false,
      position: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, newTask])
    setAddTaskFormOpen(false)
    setEditingTask(null)
  }

  const handleToggleComplete = async (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setAddTaskFormOpen(true)
  }

  const handleCommandAction = (action: string) => {
    switch (action) {
      case "complete":
        handleComplete()
        break
      case "dashboard":
        setView("dashboard")
        break
      case "taskList":
        setView("taskList")
        break
      case "addTask":
        setAddTaskFormOpen(true)
        break
      case "settings":
        setView("settings")
        break
    }
  }

  const handleNavigate = (newView: View) => {
    setView(newView)
    setMenuDrawerOpen(false)
  }

  const handleAddVoiceTask = async (taskTitle: string, date?: string, time?: string) => {
    handleAddTask({
      title: taskTitle,
      description: time ? `Scheduled for ${time}` : undefined,
      deadline: date ? new Date(date).toISOString() : undefined,
      priority: "medium",
      estimated_minutes: 15,
    })
  }

  // Empty state
  if (!currentTask && view === "task") {
    return (
      <div className="max-w-lg mx-auto min-h-screen relative">
        <header className="flex items-center justify-between px-6 py-6">
          <button
            onClick={() => setMenuDrawerOpen(true)}
            className="p-3 rounded-full bg-[#1a2332] border border-white/10"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
            <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
          </div>
          <button
            onClick={() => setAddTaskFormOpen(true)}
            className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"
          >
            <Plus className="w-5 h-5 text-emerald-400" />
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">All Clear!</h2>
            <p className="text-slate-400 mb-8">No pending tasks. Add one using the buttons below.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setVoiceReminderOpen(true)}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Voice Capture
              </button>

              <button
                onClick={() => setAddTaskFormOpen(true)}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task Manually
              </button>

              <button
                onClick={() => setView("taskList")}
                className="w-full px-6 py-3 rounded-full bg-[#1a2332] border border-white/10 text-slate-300 font-medium flex items-center justify-center gap-2"
              >
                <ListTodo className="w-5 h-5" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>

        <MenuDrawer
          isOpen={menuDrawerOpen}
          onClose={() => setMenuDrawerOpen(false)}
          onNavigate={handleNavigate}
          onAddTask={() => setAddTaskFormOpen(true)}
        />

        <AddTaskForm
          isOpen={addTaskFormOpen}
          onClose={() => {
            setAddTaskFormOpen(false)
            setEditingTask(null)
          }}
          onSubmit={handleAddTask}
          initialTask={editingTask}
        />

        {voiceReminderOpen && (
          <VoiceReminderScreen onClose={() => setVoiceReminderOpen(false)} onAddTask={handleAddVoiceTask} />
        )}

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          tasks={[]}
          onAction={handleCommandAction}
        />
      </div>
    )
  }

  const taskForView = currentTask
    ? {
        id: currentTask.id,
        title: currentTask.title,
        status: "pending" as const,
        context: "Work" as const,
        tags: [],
        estimatedMinutes: currentTask.estimated_minutes || 25,
        bestTime: "now" as const,
        friction: "medium" as const,
        size: "medium" as const,
        quickWin: false,
        delegateCandidate: false,
        vendorCandidate: false,
        createdAt: currentTask.created_at,
        dueAt: currentTask.deadline,
        energyLevel: (currentTask.energy_level || "medium") as "peak" | "medium" | "low",
        priority: (currentTask.priority || "medium") as "high" | "medium" | "low",
        surveillance: currentTask.deadline ? new Date(currentTask.deadline) < new Date() : false,
      }
    : null

  const reasoning = {
    energyMatch: 85,
    priorityReason: "High priority task based on deadline and context",
    contextNote: "Best time to work on this based on your patterns",
  }

  const userStats = {
    currentStreak: stats.current_streak,
    trustScore: stats.trust_score,
    weeklyCompletionRate: 75,
    energyAccuracy: 80,
    avgCompletionTime: 22,
  }

  const surveillanceTasks = tasks
    .filter((t) => t.deadline && new Date(t.deadline) < new Date() && !t.completed)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: "pending" as const,
      context: "Work" as const,
      tags: [],
      estimatedMinutes: t.estimated_minutes || 25,
      bestTime: "now" as const,
      friction: "medium" as const,
      size: "medium" as const,
      quickWin: false,
      delegateCandidate: false,
      vendorCandidate: false,
      createdAt: t.created_at,
      dueAt: t.deadline,
      energyLevel: (t.energy_level || "medium") as "peak" | "medium" | "low",
      priority: (t.priority || "medium") as "high" | "medium" | "low",
      surveillance: true,
      daysOverdue: Math.floor((Date.now() - new Date(t.deadline!).getTime()) / (1000 * 60 * 60 * 24)),
    }))

  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      {/* Demo mode indicator */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
          <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
        </div>
      </div>

      {view === "task" && taskForView && (
        <SingleTaskView
          task={taskForView}
          reasoning={reasoning}
          stats={userStats}
          onComplete={handleComplete}
          onCantDo={handleCantDo}
          onNavigate={handleNavigate}
          onAddTask={() => setAddTaskFormOpen(true)}
        />
      )}

      {view === "dashboard" && (
        <WarRoomDashboard
          stats={userStats}
          surveillanceTasks={surveillanceTasks}
          onBack={() => setView("task")}
          onTaskSelect={() => setView("task")}
        />
      )}

      {view === "taskList" && (
        <TaskListView
          tasks={tasks}
          onBack={() => setView("task")}
          onAddTask={() => setAddTaskFormOpen(true)}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      )}

      {view === "settings" && <SettingsScreen onBack={() => setView("task")} isDemo />}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.completed ? ("done" as const) : ("pending" as const),
          context: "Work" as const,
          tags: [],
          estimatedMinutes: t.estimated_minutes || 25,
          bestTime: "now" as const,
          friction: "medium" as const,
          size: "medium" as const,
          quickWin: false,
          delegateCandidate: false,
          vendorCandidate: false,
          createdAt: t.created_at,
          dueAt: t.deadline,
          energyLevel: (t.energy_level || "medium") as "peak" | "medium" | "low",
          priority: (t.priority || "medium") as "high" | "medium" | "low",
          surveillance: t.deadline ? new Date(t.deadline) < new Date() : false,
        }))}
        onAction={handleCommandAction}
      />

      <AddTaskForm
        isOpen={addTaskFormOpen}
        onClose={() => {
          setAddTaskFormOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleAddTask}
        initialTask={editingTask}
      />

      {voiceReminderOpen && (
        <VoiceReminderScreen onClose={() => setVoiceReminderOpen(false)} onAddTask={handleAddVoiceTask} />
      )}

      {!voiceReminderOpen && view === "task" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setVoiceReminderOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-purple-500/40 transition-shadow z-40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="w-7 h-7 text-white" fill="currentColor" />
        </motion.button>
      )}
    </div>
  )
}
