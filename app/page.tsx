"use client"

import { useState, useRef } from "react"
import { useEffect } from "react"
import { ViewManager } from "@/components/view-manager"
import { CommandPalette } from "@/components/command-palette"
import { VoiceReminderScreen } from "@/components/voice-reminder-screen"
import { Mic, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useTasks } from "@/hooks/use-tasks"
import { useUserStats } from "@/hooks/use-user-stats"
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
import { useAppStore } from "@/lib/stores/app-store"

export default function LifeOS() {
  const {
    currentView,
    modals,
    editingTask,
    userEnergyLevel,
    setView,
    openModal,
    closeModal,
    setEditingTask,
    navigateAndClose,
  } = useAppStore()

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
    resortForEnergy,
    refetch,
  } = useTasks()
  const { stats, loading: statsLoading } = useUserStats()
  const { isStuck, stuckInfo, recordSkip } = useStuckDetection(currentTask?.id)
  const { shouldShowPlanning, completePlanning, dismissPlanning } = useDailyPlanning()
  const router = useRouter()

  const processingTasksRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        openModal("commandPalette")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [openModal])

  useEffect(() => {
    if (currentView === "taskList") {
      loadAllTasks()
    }
  }, [currentView])

  const [allTasks, setAllTasks] = useState<any[]>([])

  useEffect(() => {
    if (allTasks.length > 0 && tasks.length > 0) {
      const activeTasks = new Set(tasks.map((t) => t.id))

      setAllTasks((prev) => {
        const updated = prev.map((t) => {
          // If a task is NOT in useTasks (which only has pending), mark it completed
          if (!activeTasks.has(t.id) && !t.completed && !t.skipped) {
            console.log("[v0] Syncing task to completed in allTasks:", t.title)
            return { ...t, completed: true, completed_at: new Date().toISOString() }
          }
          return t
        })
        return updated
      })
    }
  }, [tasks, allTasks.length])

  const loadAllTasks = async () => {
    const allTasksData = await getAllTasks()
    setAllTasks(allTasksData)
  }

  const handleComplete = async () => {
    if (!currentTask) return

    if (processingTasksRef.current.has(currentTask.id)) {
      console.log("[v0] handleComplete - task already being processed, skipping")
      return
    }

    processingTasksRef.current.add(currentTask.id)
    try {
      await completeTask(currentTask.id)
    } finally {
      setTimeout(() => {
        processingTasksRef.current.delete(currentTask.id)
      }, 1000)
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
    console.log("[v0] handleAddTaskSubmit called with:", taskData)
    console.log("[v0] handleAddTaskSubmit - editingTask:", editingTask?.id || "none")

    if (editingTask) {
      console.log("[v0] handleAddTaskSubmit - updating existing task")
      await updateTask(editingTask.id, taskData)
      setEditingTask(null)
    } else {
      console.log("[v0] handleAddTaskSubmit - creating new task")
      const result = await addTask(taskData)
      console.log("[v0] handleAddTaskSubmit - addTask result:", result)
    }

    await loadAllTasks()
    refetch()
  }

  const handleToggleComplete = async (id: string) => {
    console.log("[v0] handleToggleComplete called for task:", id)

    if (processingTasksRef.current.has(id)) {
      console.log("[v0] handleToggleComplete - task already being processed, skipping duplicate call")
      return
    }

    const task = allTasks.find((t) => t.id === id)
    console.log("[v0] handleToggleComplete - task found:", task?.title, "completed:", task?.completed)

    if (!task) {
      console.log("[v0] handleToggleComplete - task not found in allTasks")
      return
    }

    processingTasksRef.current.add(id)
    console.log("[v0] handleToggleComplete - marked as processing")

    try {
      if (task.completed) {
        console.log("[v0] handleToggleComplete - marking as incomplete")
        await updateTask(id, { completed: false, completed_at: undefined })
      } else {
        console.log("[v0] handleToggleComplete - marking as complete")
        await completeTask(id)
      }

      const newCompletedState = !task.completed
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: newCompletedState,
                completed_at: newCompletedState ? new Date().toISOString() : undefined,
              }
            : t,
        ),
      )
      console.log("[v0] handleToggleComplete - local state updated, completed:", newCompletedState)

      refetch()
      console.log("[v0] handleToggleComplete - useTasks refetch triggered (no loadAllTasks)")
    } catch (error) {
      console.error("[v0] handleToggleComplete - error:", error)
      setAllTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed, completed_at: task.completed_at } : t)),
      )
    } finally {
      setTimeout(() => {
        processingTasksRef.current.delete(id)
        console.log("[v0] handleToggleComplete - removed from processing set")
      }, 1500)
    }
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
    await loadAllTasks()
    refetch()
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    openModal("addTask")
  }

  const handleCommandAction = (action: string) => {
    switch (action) {
      case "complete":
        handleComplete()
        break
      case "dashboard":
        navigateAndClose("dashboard")
        break
      case "taskList":
        navigateAndClose("taskList")
        break
      case "addTask":
        openModal("addTask")
        break
      case "settings":
        navigateAndClose("settings")
        break
      default:
        break
    }
  }

  const handleCantDo = () => {
    // Placeholder
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

  const totalTasks = (stats?.total_completed || 0) + (stats?.total_skipped || 0)
  const computedCompletionRate = totalTasks > 0 ? Math.round(((stats?.total_completed || 0) / totalTasks) * 100) : 75

  const userStats = {
    currentStreak: stats?.current_streak || 0,
    trustScore: stats?.trust_score || 50,
    weeklyCompletionRate: computedCompletionRate,
    energyAccuracy: 80, // Default - not tracked in database
    avgCompletionTime: 22, // Default - not tracked in database
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
        currentView={currentView}
        tasks={tasks}
        currentTask={currentTask}
        stats={userStats}
        reasoning={reasoning}
        surveillanceTasks={surveillanceTasks}
        allTasks={allTasks}
        onComplete={handleComplete}
        onCantDo={handleCantDo}
        onNavigate={(view) => navigateAndClose(view)}
        onAddTask={() => openModal("addTask")}
        onToggleComplete={handleToggleComplete}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
        onOpenMenuDrawer={() => openModal("menuDrawer")}
        onOpenVoiceReminder={() => openModal("voiceReminder")}
      />

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
        isOpen={modals.stuckTask}
        onClose={() => closeModal("stuckTask")}
        task={currentTask ? { id: currentTask.id, title: currentTask.title } : { id: "", title: "" }}
        skipCount={stuckInfo?.skipCount || 0}
        onBreakDown={() => {
          closeModal("stuckTask")
          openModal("breakdown")
        }}
        onDelegate={() => closeModal("stuckTask")}
        onHireOut={() => closeModal("stuckTask")}
        onDelete={async () => {
          if (currentTask) await deleteTask(currentTask.id)
          closeModal("stuckTask")
        }}
        onKeep={(reason) => closeModal("stuckTask")}
      />

      <TaskBreakdownModal
        isOpen={modals.breakdown}
        onClose={() => closeModal("breakdown")}
        task={currentTask ? { id: currentTask.id, title: currentTask.title } : { id: "", title: "" }}
        userEnergy={userEnergyLevel}
        onCreateSubtasks={async (subtasks) => {
          for (const sub of subtasks) {
            await addTask({
              title: sub.title,
              estimated_minutes: sub.estimatedMinutes,
              energy_level: sub.energyLevel,
              priority: "medium",
            })
          }
          if (currentTask) {
            await completeTask(currentTask.id)
          }
          closeModal("breakdown")
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
          closeModal("breakdown")
          refetch()
        }}
        onCompleteMainTask={async () => {
          if (currentTask) await completeTask(currentTask.id)
          closeModal("breakdown")
        }}
      />

      <CompletionCelebration />

      <CommandPalette
        isOpen={modals.commandPalette}
        onClose={() => closeModal("commandPalette")}
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
          energyLevel: t.energy_level || "medium",
          priority: t.priority || "medium",
          surveillance: t.deadline ? new Date(t.deadline) < new Date() : false,
        }))}
        onAction={handleCommandAction}
      />

      <AddTaskForm
        isOpen={modals.addTask}
        onClose={() => {
          closeModal("addTask")
          setEditingTask(null)
        }}
        onSubmit={handleAddTaskSubmit}
        initialTask={editingTask}
      />

      {modals.voiceReminder && (
        <VoiceReminderScreen onClose={() => closeModal("voiceReminder")} onAddTask={handleAddVoiceTask} />
      )}

      <MenuDrawer
        isOpen={modals.menuDrawer}
        onClose={() => closeModal("menuDrawer")}
        onNavigate={(view) => navigateAndClose(view)}
        onAddTask={() => openModal("addTask")}
      />

      {!modals.voiceReminder && currentView === "task" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => openModal("voiceReminder")}
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
