"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Search, X, Check, MoreVertical, Plus } from "lucide-react"
import type { Task } from "@/hooks/use-tasks"

type FilterTab = "pending" | "completed" | "skipped" | "all"

interface TaskListViewProps {
  tasks: Task[]
  onBack: () => void
  onAddTask: () => void
  onToggleComplete: (id: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onEditTask: (task: Task) => void
}

export function TaskListView({
  tasks,
  onBack,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
}: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("pending")

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (activeTab === "pending") {
      result = result.filter((t) => !t.completed && !t.skipped)
    } else if (activeTab === "completed") {
      result = result.filter((t) => t.completed)
    } else if (activeTab === "skipped") {
      result = result.filter((t) => t.skipped)
    }

    if (searchQuery) {
      result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return result
  }, [tasks, activeTab, searchQuery])

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {}
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    filteredTasks.forEach((task) => {
      const taskDate = new Date(task.created_at).toDateString()
      let groupKey: string

      if (taskDate === today) groupKey = "Today"
      else if (taskDate === yesterday) groupKey = "Yesterday"
      else
        groupKey = new Date(task.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })

      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey]!.push(task)
    })

    return groups
  }, [filteredTasks])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: tasks.filter((t) => !t.completed && !t.skipped).length },
    { key: "completed", label: "Completed", count: tasks.filter((t) => t.completed).length },
    { key: "skipped", label: "Skipped", count: tasks.filter((t) => t.skipped).length },
    { key: "all", label: "All", count: tasks.length },
  ]

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-semibold">All Tasks</h1>
        <div className="w-16" />
      </header>

      {/* Search */}
      <div className="px-5 py-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#1a2332] border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "text-cyan-400 border-cyan-400"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="px-5 py-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <EmptyState tab={activeTab} searchQuery={searchQuery} onAddTask={onAddTask} />
        ) : (
          Object.entries(groupedTasks).map(([date, dateTasks]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-medium text-slate-500 mb-3 px-1">
                {date} ({dateTasks.length})
              </h3>
              <div className="space-y-3">
                {dateTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onToggleComplete={onToggleComplete}
                    onEdit={() => onEditTask(task)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={onAddTask}
        aria-label="Add new task"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 z-50"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </div>
  )
}

function TaskCard({
  task,
  index,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: Task
  index: number
  onToggleComplete: (id: string) => Promise<void>
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-xl bg-[#131720] border border-white/5"
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors flex-shrink-0 ${
            task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-cyan-500"
          }`}
        >
          {task.completed && <Check size={14} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${task.completed ? "text-slate-500 line-through" : "text-white"}`}>
            {task.title}
          </h3>

          <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full ${
                task.priority === "high"
                  ? "bg-red-500/20 text-red-400"
                  : task.priority === "medium"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {task.priority || "medium"}
            </span>
            <span className="text-slate-500">
              {task.energy_level === "peak" ? "⚡" : task.energy_level === "medium" ? "⚙️" : "💤"}
            </span>
            <span className="text-slate-600">{task.estimated_minutes || 25}m</span>
          </div>

          {task.completed && task.completed_at && (
            <p className="text-xs text-slate-600 mt-2">Completed {new Date(task.completed_at).toLocaleString()}</p>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Task options"
            className="text-slate-600 hover:text-slate-400 p-1"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 py-2 rounded-xl bg-[#1a2332] border border-white/10 shadow-xl">
                <button
                  onClick={() => {
                    onEdit()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggleComplete(task.id)
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                >
                  {task.completed ? "Mark incomplete" : "Mark complete"}
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({
  tab,
  searchQuery,
  onAddTask,
}: {
  tab: FilterTab
  searchQuery: string
  onAddTask: () => void
}) {
  if (searchQuery) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-white mb-2">No results</h3>
        <p className="text-slate-500">Try a different search term.</p>
      </div>
    )
  }

  if (tab === "completed") {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-white mb-2">No completed tasks yet</h3>
        <p className="text-slate-500">Complete some tasks to see them here.</p>
      </div>
    )
  }

  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4">🎯</div>
      <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
      <p className="text-slate-500 mb-6">No pending tasks. Time to add some.</p>
      <button
        onClick={onAddTask}
        className="px-6 py-3 rounded-full bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors"
      >
        + Add Task
      </button>
    </div>
  )
}
