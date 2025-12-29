"use client"

import { SingleTaskView } from "./single-task-view"
import { WarRoomDashboard } from "./war-room-dashboard"
import { TaskListView } from "./task-list-view"
import { SettingsScreen } from "./settings-screen"
import { HabitsView } from "./habits-view"
import { Mic, Menu, Plus, ListTodo } from "lucide-react"
import type { Task } from "@/hooks/use-tasks"
import type { Reasoning, UserStats } from "@/lib/types"

type View = "task" | "dashboard" | "settings" | "taskList" | "habits"

interface ViewManagerProps {
  currentView: View
  tasks: Task[]
  currentTask: Task | null
  stats: UserStats
  reasoning: Reasoning
  surveillanceTasks: Array<{ id: string; title: string; daysOverdue: number }>
  allTasks: any[]
  onComplete: () => void
  onCantDo: () => void
  onNavigate: (view: View) => void
  onAddTask: () => void
  onToggleComplete: (id: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onEditTask: (task: any) => void
  onOpenMenuDrawer: () => void
  onOpenVoiceReminder: () => void
}

export function ViewManager({
  currentView,
  currentTask,
  stats,
  reasoning,
  surveillanceTasks,
  allTasks,
  onComplete,
  onCantDo,
  onNavigate,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onOpenMenuDrawer,
  onOpenVoiceReminder,
}: ViewManagerProps) {
  // Empty state when no current task and on task view
  if (!currentTask && currentView === "task") {
    return (
      <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
        <header className="flex items-center justify-between px-6 py-6">
          <button onClick={onOpenMenuDrawer} className="p-3 rounded-full bg-[#1a2332] border border-white/10">
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={onAddTask} className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30">
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
                onClick={onOpenVoiceReminder}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Voice Capture
              </button>

              <button
                onClick={onAddTask}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task Manually
              </button>

              <button
                onClick={() => onNavigate("taskList")}
                className="w-full px-6 py-3 rounded-full bg-[#1a2332] border border-white/10 text-slate-300 font-medium flex items-center justify-center gap-2"
              >
                <ListTodo className="w-5 h-5" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Non-task views without current task
  if (!currentTask && (currentView === "taskList" || currentView === "settings" || currentView === "dashboard" || currentView === "habits")) {
    return (
      <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
        {currentView === "taskList" && (
          <TaskListView
            tasks={allTasks}
            onBack={() => onNavigate("task")}
            onAddTask={onAddTask}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        )}

        {currentView === "settings" && <SettingsScreen onBack={() => onNavigate("task")} />}

        {currentView === "dashboard" && (
          <WarRoomDashboard
            stats={stats}
            surveillanceTasks={surveillanceTasks}
            onBack={() => onNavigate("task")}
            onTaskSelect={() => onNavigate("task")}
          />
        )}

        {currentView === "habits" && <HabitsView onBack={() => onNavigate("task")} />}
      </div>
    )
  }

  // Main views with current task
  if (currentTask) {
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
      energyLevel: (currentTask.energy_level || "medium") as "peak" | "medium" | "low",
      priority: (currentTask.priority || "medium") as "high" | "medium" | "low",
      surveillance: currentTask.deadline ? new Date(currentTask.deadline) < new Date() : false,
    }

    return (
      <div className="max-w-lg mx-auto min-h-screen relative bg-[#0a0f16]">
        {currentView === "task" && (
          <SingleTaskView
            task={taskForView}
            reasoning={reasoning}
            stats={stats}
            onComplete={onComplete}
            onCantDo={onCantDo}
            onNavigate={onNavigate}
            onAddTask={onAddTask}
          />
        )}

        {currentView === "dashboard" && (
          <WarRoomDashboard
            stats={stats}
            surveillanceTasks={surveillanceTasks}
            onBack={() => onNavigate("task")}
            onTaskSelect={() => onNavigate("task")}
          />
        )}

        {currentView === "taskList" && (
          <TaskListView
            tasks={allTasks}
            onBack={() => onNavigate("task")}
            onAddTask={onAddTask}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        )}

        {currentView === "settings" && <SettingsScreen onBack={() => onNavigate("task")} />}

        {currentView === "habits" && <HabitsView onBack={() => onNavigate("task")} />}
      </div>
    )
  }

  return null
}
