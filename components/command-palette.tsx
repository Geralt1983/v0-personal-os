"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Check, MessageCircle, Mic, BarChart3, Settings, X, ListTodo, Plus } from "lucide-react"
import type { Task } from "@/lib/types"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onAction: (action: string, task?: Task) => void
}

interface CommandItem {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  keywords?: string[]
  action: () => void
}

export function CommandPalette({ isOpen, onClose, tasks, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions: CommandItem[] = [
    {
      id: "complete",
      label: "Complete current task",
      icon: <Check size={18} />,
      shortcut: "⌘↵",
      keywords: ["done", "finish"],
      action: () => onAction("complete"),
    },
    {
      id: "ai",
      label: "Talk to AI",
      icon: <MessageCircle size={18} />,
      shortcut: "⌘J",
      keywords: ["chat", "help"],
      action: () => onAction("ai"),
    },
    {
      id: "voice",
      label: "Voice capture",
      icon: <Mic size={18} />,
      shortcut: "⌘U",
      keywords: ["speak", "record"],
      action: () => onAction("voice"),
    },
    {
      id: "taskList",
      label: "View all tasks",
      icon: <ListTodo size={18} />,
      shortcut: "⌘L",
      keywords: ["list", "all", "tasks"],
      action: () => onAction("taskList"),
    },
    {
      id: "addTask",
      label: "Add new task",
      icon: <Plus size={18} />,
      shortcut: "⌘N",
      keywords: ["new", "create", "add"],
      action: () => onAction("addTask"),
    },
    {
      id: "dashboard",
      label: "Open War Room",
      icon: <BarChart3 size={18} />,
      shortcut: "⌘D",
      keywords: ["dashboard", "stats"],
      action: () => onAction("dashboard"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      shortcut: "⌘,",
      keywords: ["preferences"],
      action: () => onAction("settings"),
    },
  ]

  const allItems = [
    ...quickActions,
    ...tasks.slice(0, 5).map((task) => ({
      id: task.id,
      icon: <div className="w-2 h-2 rounded-full bg-cyan-500" />,
      label: task.title,
      keywords: [] as string[],
      action: () => onAction("select", task),
    })),
  ]

  const filteredItems = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase())),
      )
    : allItems

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          filteredItems[selectedIndex]?.action()
          onClose()
          break
        case "Escape":
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex, onClose])

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0f1419] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Search */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                <Search size={20} className="text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  placeholder="Search or type a command..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none text-lg"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-400">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {!query && (
                  <div className="px-4 py-2">
                    <span className="text-xs uppercase tracking-wider text-slate-600">Quick Actions</span>
                  </div>
                )}

                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action()
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedIndex === index
                        ? "bg-[#1a2332] border-l-2 border-cyan-500"
                        : "hover:bg-[#1a2332]/50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    <span className="text-white flex-1">{item.label}</span>
                    {"shortcut" in item && item.shortcut && (
                      <span className="text-xs text-slate-600 bg-[#1a2332] px-2 py-1 rounded">{item.shortcut}</span>
                    )}
                  </button>
                ))}

                {filteredItems.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-500">No results found</div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-slate-600">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-[#1a2332] rounded">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-[#1a2332] rounded">↵</kbd> select
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-[#1a2332] rounded">esc</kbd> close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
