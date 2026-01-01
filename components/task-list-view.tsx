"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, X, Check, MoreVertical, Plus, Clock, Zap, Sparkles, Moon, Sun } from "lucide-react"
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

  const tabs: { key: FilterTab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: "pending",
      label: "Active",
      count: tasks.filter((t) => !t.completed && !t.skipped).length,
      icon: <Sparkles className="w-3.5 h-3.5" />
    },
    {
      key: "completed",
      label: "Done",
      count: tasks.filter((t) => t.completed).length,
      icon: <Check className="w-3.5 h-3.5" />
    },
    {
      key: "skipped",
      label: "Skipped",
      count: tasks.filter((t) => t.skipped).length,
      icon: <Moon className="w-3.5 h-3.5" />
    },
    {
      key: "all",
      label: "All",
      count: tasks.length,
      icon: <Sun className="w-3.5 h-3.5" />
    },
  ]

  return (
    <div className="min-h-screen bg-bg-base text-white pb-24">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(191, 127, 255, 0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 border-b border-white/5">
        <motion.button
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          All Tasks
        </h1>
        <div className="w-16" />
      </header>

      {/* Search */}
      <div className="relative z-10 px-5 py-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl glass-card-sm border-white/10 text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-cyan/50 transition-all duration-300"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors"
              >
                <X size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-5 flex gap-1 overflow-x-auto scrollbar-hide pb-px">
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium rounded-t-xl transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.key
                ? "text-accent-cyan"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key
                ? "bg-accent-cyan/20 text-accent-cyan"
                : "bg-white/5 text-text-tertiary"
            }`}>
              {tab.count}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Task List */}
      <div className="relative z-10 px-5 py-5">
        {Object.keys(groupedTasks).length === 0 ? (
          <EmptyState tab={activeTab} searchQuery={searchQuery} onAddTask={onAddTask} />
        ) : (
          Object.entries(groupedTasks).map(([date, dateTasks]) => (
            <motion.div
              key={date}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-text-secondary">
                  {date}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-xs text-text-tertiary px-2 py-0.5 rounded-full bg-white/5">
                  {dateTasks.length}
                </span>
              </div>
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
            </motion.div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={onAddTask}
        aria-label="Add new task"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-400 to-emerald-500 flex items-center justify-center z-50 overflow-hidden"
        style={{
          boxShadow: "0 0 30px rgba(52, 211, 153, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: '50%' }}
        />
        <Plus size={24} className="text-black relative z-10" strokeWidth={3} />
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
  const [isHovered, setIsHovered] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleToggle = async () => {
    setIsCompleting(true)
    await onToggleComplete(task.id)
    setIsCompleting(false)
  }

  const getPriorityConfig = (priority: string | undefined) => {
    switch (priority) {
      case "high":
        return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", glow: "rgba(239, 68, 68, 0.2)" }
      case "medium":
        return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", glow: "rgba(245, 158, 11, 0.2)" }
      default:
        return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", glow: "rgba(52, 211, 153, 0.2)" }
    }
  }

  const priorityConfig = getPriorityConfig(task.priority)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isCompleting ? 0.5 : 1,
        y: 0,
        scale: isCompleting ? 0.98 : 1
      }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Hover glow */}
      <motion.div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10 opacity-0 blur-md"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div className="glass-card-sm p-4 relative overflow-hidden">
        {/* Completed overlay */}
        {task.completed && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 pointer-events-none" />
        )}

        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <motion.button
            onClick={handleToggle}
            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
            className={`relative w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all duration-300 flex-shrink-0 ${
              task.completed
                ? "bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-400"
                : "border-text-tertiary hover:border-accent-cyan hover:bg-accent-cyan/10"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence>
              {task.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={14} className="text-black" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
            {!task.completed && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{
                  boxShadow: isHovered ? "0 0 10px rgba(0, 229, 255, 0.3)" : "none"
                }}
              />
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold leading-snug transition-all duration-300 ${
              task.completed
                ? "text-text-tertiary line-through"
                : "text-white"
            }`}>
              {task.title}
            </h3>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {/* Priority */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
              >
                {task.priority === "high" && <Zap className="w-2.5 h-2.5" />}
                {task.priority || "low"}
              </span>

              {/* Energy */}
              <span className="text-sm">
                {task.energy_level === "peak" ? "⚡" : task.energy_level === "medium" ? "⚙️" : "💤"}
              </span>

              {/* Duration */}
              <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                <Clock className="w-3 h-3" />
                {task.estimated_minutes || 25}m
              </span>
            </div>

            {task.completed && task.completed_at && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-400/70 mt-2 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                {new Date(task.completed_at).toLocaleString()}
              </motion.p>
            )}
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Task options"
              className="text-text-tertiary hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreVertical size={18} />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-20 w-44 py-2 rounded-xl glass-card-premium border border-white/10 overflow-hidden"
                    style={{
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 229, 255, 0.1)",
                    }}
                  >
                    <button
                      onClick={() => {
                        onEdit()
                        setMenuOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Edit task
                    </button>
                    <button
                      onClick={() => {
                        handleToggle()
                        setMenuOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {task.completed ? "Mark incomplete" : "Mark complete"}
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => {
                        onDelete()
                        setMenuOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      Delete task
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 text-center"
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔍
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
        <p className="text-text-secondary">Try a different search term</p>
      </motion.div>
    )
  }

  if (tab === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 text-center"
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📋
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">No completed tasks yet</h3>
        <p className="text-text-secondary">Complete some tasks to see them here</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 text-center"
    >
      <motion.div
        className="text-6xl mb-6"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🎯
      </motion.div>
      <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
      <p className="text-text-secondary mb-8">No pending tasks. Time to add some.</p>
      <motion.button
        onClick={onAddTask}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-bold transition-all duration-300"
        style={{
          boxShadow: "0 0 30px rgba(0, 229, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)",
        }}
      >
        + Add Task
      </motion.button>
    </motion.div>
  )
}
