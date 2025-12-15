"use client"

import { useState, useEffect } from "react"
import { SingleTaskView } from "@/components/single-task-view"
import { WarRoomDashboard } from "@/components/war-room-dashboard"
import { CommandPalette } from "@/components/command-palette"
import { VoiceReminderScreen } from "@/components/voice-reminder-screen"
import { Mic, Loader2, Menu, Plus, ListTodo } from "lucide-react"
import { motion } from "framer-motion"
import { useTasks } from "@/hooks/use-tasks"
import { useUserStats } from "@/hooks/use-user-stats"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { TaskListView } from "@/components/task-list-view"
import { AddTaskForm } from "@/components/add-task-form"
import { SettingsScreen } from "@/components/settings-screen"
import { MenuDrawer } from "@/components/menu-drawer"

type View = "task" | "dashboard" | "settings" | "taskList"

export default function LifeOS() {
  const [view, setView] = useState<View>("task")
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [voiceReminderOpen, setVoiceReminderOpen] = useState(false)
  const [addTaskFormOpen, setAddTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)

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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[v0] Checking auth on page load")
      const {
        data: { user },
      } = await supabase.auth.getUser()
      console.log("[v0] Auth check result:", { user: user?.id })
      if (!user) {
        console.log("[v0] No user, redirecting to login")
        router.push("/auth/login")
      }
    }
    checkAuth()
  }, [])

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
    await completeTask(currentTask.id)
  }

  const handleCantDo = async (reason?: string) => {
    if (!currentTask) return
    await skipTask(currentTask.id, reason)
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
    console.log("[v0] handleAddTaskSubmit called:", { editingTask: !!editingTask, taskData })

    if (editingTask) {
      console.log("[v0] Updating task:", editingTask.id)
      await updateTask(editingTask.id, taskData)
      setEditingTask(null)
    } else {
      console.log("[v0] Creating new task")
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
    console.log("[v0] handleEditTask called:", task)
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

  const handleNavigate = (newView: "task" | "dashboard" | "settings" | "taskList") => {
    console.log("[v0] Page handleNavigate called with:", newView, "current view:", view)
    setView(newView)
    setMenuDrawerOpen(false)
  }

  const handleOpenAddTask = () => {
    console.log("[v0] handleOpenAddTask called")
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

  if (!currentTask && view === "task") {
    return (
      <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
        {/* Header with menu access */}
        <header className="flex items-center justify-between px-6 py-6">
          <button
            onClick={() => setMenuDrawerOpen(true)}
            className="p-3 rounded-full bg-[#1a2332] border border-white/10"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={handleOpenAddTask}
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
                onClick={handleOpenAddTask}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task Manually
              </button>

              <button
                onClick={() => {
                  console.log("[v0] View All Tasks clicked from empty state")
                  setView("taskList")
                }}
                className="w-full px-6 py-3 rounded-full bg-[#1a2332] border border-white/10 text-slate-300 font-medium flex items-center justify-center gap-2"
              >
                <ListTodo className="w-5 h-5" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Menu Drawer for empty state */}
        <MenuDrawer
          isOpen={menuDrawerOpen}
          onClose={() => setMenuDrawerOpen(false)}
          onNavigate={handleNavigate}
          onAddTask={handleOpenAddTask}
        />

        {/* Add Task Form */}
        <AddTaskForm
          isOpen={addTaskFormOpen}
          onClose={() => {
            setAddTaskFormOpen(false)
            setEditingTask(null)
          }}
          onSubmit={handleAddTaskSubmit}
          initialTask={editingTask}
        />

        {/* Voice Reminder */}
        {voiceReminderOpen && (
          <VoiceReminderScreen onClose={() => setVoiceReminderOpen(false)} onAddTask={handleAddVoiceTask} />
        )}

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          tasks={[]}
          onAction={handleCommandAction}
        />
      </div>
    )
  }

  if (!currentTask && (view === "taskList" || view === "settings" || view === "dashboard")) {
    return (
      <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
        {view === "taskList" && (
          <TaskListView
            tasks={allTasks}
            onBack={() => setView("task")}
            onAddTask={handleOpenAddTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        )}

        {view === "settings" && <SettingsScreen onBack={() => setView("task")} />}

        {view === "dashboard" && (
          <WarRoomDashboard
            stats={{ currentStreak: stats?.current_streak || 0, trustScore: stats?.trust_score || 50 }}
            surveillanceTasks={[]}
            onBack={() => setView("task")}
            onTaskSelect={() => setView("task")}
          />
        )}

        {/* Add Task Form */}
        <AddTaskForm
          isOpen={addTaskFormOpen}
          onClose={() => {
            setAddTaskFormOpen(false)
            setEditingTask(null)
          }}
          onSubmit={handleAddTaskSubmit}
          initialTask={editingTask}
        />

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          tasks={[]}
          onAction={handleCommandAction}
        />
      </div>
    )
  }

  const taskForView = {
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
  }

  const reasoning = {
    energyMatch: 85,
    priorityReason: "High priority task based on deadline and context",
    contextNote: "Best time to work on this based on your patterns",
  }

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
    <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
      {view === "task" && (
        <SingleTaskView
          task={taskForView}
          reasoning={reasoning}
          stats={userStats}
          onComplete={handleComplete}
          onCantDo={handleCantDo}
          onNavigate={handleNavigate}
          onAddTask={handleOpenAddTask}
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
          tasks={allTasks}
          onBack={() => setView("task")}
          onAddTask={handleOpenAddTask}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      )}

      {view === "settings" && <SettingsScreen onBack={() => setView("task")} />}

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
