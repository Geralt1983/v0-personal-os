"use client"

import { useState, useEffect } from "react"
import { ViewManager } from "@/components/view-manager"
import { CommandPalette } from "@/components/command-palette"
import { VoiceReminderScreen } from "@/components/voice-reminder-screen"
import { Mic, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useTasks } from "@/hooks/use-tasks"
import { useUserStats } from "@/hooks/use-user-stats"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AddTaskForm } from "@/components/add-task-form"
import { MenuDrawer } from "@/components/menu-drawer"
import { generateTaskReasoning } from "@/lib/generate-reasoning"
import { useStuckDetection } from "@/hooks/use-stuck-detection"
import { useDailyPlanning } from "@/hooks/use-daily-planning"
import { StuckTaskModal } from "@/components/stuck-task-modal"
import { TaskBreakdownModal } from "@/components/task-breakdown-modal"
import { DailyPlanningModal } from "@/components/daily-planning-modal"
import { CompletionCelebration } from "@/components/completion-celebration"

type View = "task" | "dashboard" | "settings" | "taskList"

export default function LifeOS() {
  // View state
  const [view, setView] = useState<View>("task")

  // Modal states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [voiceReminderOpen, setVoiceReminderOpen] = useState(false)
  const [addTaskFormOpen, setAddTaskFormOpen] = useState(false)
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [showStuckModal, setShowStuckModal] = useState(false)
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Data states
  const [editingTask, setEditingTask] = useState<any>(null)
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [tasksCompletedToday, setTasksCompletedToday] = useState(0)

  // Hooks
  const {
    currentTask,
    tasks,
    loading: tasksLoading,
    completeTask,
    skipTask,
    addTask,
    deleteTask,
    updateTask,
    getAllTasks,
    refetch,
  } = useTasks()
  const { stats, loading: statsLoading } = useUserStats()
  const { isStuck, stuckInfo, recordSkip } = useStuckDetection(currentTask?.id)
  const { shouldShowPlanning, userEnergyLevel, completePlanning, dismissPlanning } = useDailyPlanning()
  const router = useRouter()
  const supabase = createClient()

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      }
    }
    checkAuth()
  }, [])

  // Keyboard shortcuts
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

  // Load all tasks when viewing task list
  useEffect(() => {
    if (view === "taskList") {
      loadAllTasks()
    }
  }, [view])

  const loadAllTasks = async () => {
    const allTasksData = await getAllTasks()
    setAllTasks(allTasksData)
  }

  const handleComplete = async () => {
    if (!currentTask) return
    setShowCelebration(true)
    setTasksCompletedToday((prev) => prev + 1)
    await completeTask(currentTask.id)
  }

  const handleCantDo = async (reason?: string) => {
    if (!currentTask) return
    await recordSkip(currentTask.id, reason)

    if (stuckInfo && stuckInfo.skipCount >= 2) {
      setShowStuckModal(true)
    } else {
      await skipTask(currentTask.id, reason)
    }
  }

  const handleAddVoiceTask = async (taskTitle: string, date?: string, time?: string) => {
    const deadline = date ? new Date(date).toISOString() : undefined
    await addTask({
      title: taskTitle,
      description: time ? `Scheduled for ${time}` : undefined,
      deadline,
      priority: "medium",
      estimated_minutes: 15,
    })
    refetch()
  }

  const handleAddTaskSubmit = async (taskData: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData)
      setEditingTask(null)
    } else {
      await addTask(taskData)
    }

    await loadAllTasks()
    refetch()
  }

  const handleToggleComplete = async (id: string) => {
    const task = allTasks.find((t) => t.id === id)
    if (!task) return

    if (task.completed) {
      await updateTask(id, { completed: false, completed_at: null })
    } else {
      await completeTask(id)
    }
    await loadAllTasks()
    refetch()
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
    await loadAllTasks()
    refetch()
  }

  const handleEditTask = (task: any) => {
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
      default:
        break
    }
  }

  const handleNavigate = (newView: View) => {
    setView(newView)
    setMenuDrawerOpen(false)
  }

  const handleOpenAddTask = () => {
    setAddTaskFormOpen(true)
  }

  if (tasksLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  const reasoning = currentTask
    ? generateTaskReasoning({
        title: currentTask.title,
        priority: currentTask.priority,
        energy_level: currentTask.energy_level,
        estimated_minutes: currentTask.estimated_minutes,
        deadline: currentTask.deadline,
        created_at: currentTask.created_at,
      })
    : { energyMatch: 0, priorityReason: "", contextNote: "" }

  const userStats = {
    currentStreak: stats?.current_streak || 0,
    trustScore: stats?.trust_score || 50,
  }

  const surveillanceTasks = tasks
    .filter((t) => t.deadline && new Date(t.deadline) < new Date())
    .map((t) => ({
      id: t.id,
      title: t.title,
      daysOverdue: Math.floor((Date.now() - new Date(t.deadline!).getTime()) / (1000 * 60 * 60 * 24)),
    }))

  return (
    <>
      <ViewManager
        currentView={view}
        tasks={tasks}
        currentTask={currentTask}
        stats={userStats}
        reasoning={reasoning}
        surveillanceTasks={surveillanceTasks}
        allTasks={allTasks}
        onComplete={handleComplete}
        onCantDo={handleCantDo}
        onNavigate={handleNavigate}
        onAddTask={handleOpenAddTask}
        onToggleComplete={handleToggleComplete}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
        onOpenMenuDrawer={() => setMenuDrawerOpen(true)}
        onOpenVoiceReminder={() => setVoiceReminderOpen(true)}
      />

      {/* Modals and overlays */}
      <DailyPlanningModal
        isOpen={shouldShowPlanning}
        onClose={dismissPlanning}
        tasks={tasks}
        onSetEnergyLevel={(level) => completePlanning(level)}
        onStartDay={(topTasks) => {
          completePlanning(userEnergyLevel || "medium")
        }}
      />

      <StuckTaskModal
        isOpen={showStuckModal}
        onClose={() => setShowStuckModal(false)}
        task={currentTask ? { id: currentTask.id, title: currentTask.title } : { id: "", title: "" }}
        skipCount={stuckInfo?.skipCount || 0}
        onBreakDown={() => {
          setShowStuckModal(false)
          setShowBreakdownModal(true)
        }}
        onDelegate={() => {
          setShowStuckModal(false)
        }}
        onHireOut={() => {
          setShowStuckModal(false)
        }}
        onDelete={async () => {
          if (currentTask) await deleteTask(currentTask.id)
          setShowStuckModal(false)
        }}
        onKeep={(reason) => {
          setShowStuckModal(false)
        }}
      />

      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        task={currentTask ? { id: currentTask.id, title: currentTask.title } : { id: "", title: "" }}
        onCreateSubtasks={async (subtasks) => {
          for (const sub of subtasks) {
            await addTask({
              title: sub.title,
              estimated_minutes: sub.estimatedMinutes,
              energy_level: sub.energyLevel,
              priority: "medium",
            })
          }
          if (currentTask) await deleteTask(currentTask.id)
          setShowBreakdownModal(false)
          refetch()
        }}
        onReplaceWithFirst={async (subtask) => {
          if (currentTask) {
            await updateTask(currentTask.id, {
              title: subtask.title,
              estimated_minutes: subtask.estimatedMinutes,
              energy_level: subtask.energyLevel,
            })
          }
          setShowBreakdownModal(false)
          refetch()
        }}
      />

      <CompletionCelebration
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
        streak={stats?.current_streak || 0}
        tasksCompletedToday={tasksCompletedToday}
        isQuickWin={(currentTask?.estimated_minutes || 25) <= 10}
      />

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
        }))}
        onAction={handleCommandAction}
      />

      <AddTaskForm
        isOpen={addTaskFormOpen}
        onClose={() => {
          setAddTaskFormOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleAddTaskSubmit}
        initialTask={editingTask}
      />

      {voiceReminderOpen && (
        <VoiceReminderScreen onClose={() => setVoiceReminderOpen(false)} onAddTask={handleAddVoiceTask} />
      )}

      <MenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        onNavigate={handleNavigate}
        onAddTask={handleOpenAddTask}
      />

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
    </>
  )
}
