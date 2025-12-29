"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Home, SettingsIcon, List, ListTodo, Plus, Repeat } from "lucide-react"

const MENU_VERSION = "v2.1"

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (view: "task" | "dashboard" | "settings" | "taskList" | "habits") => void
  onAddTask?: () => void
}

export function MenuDrawer({ isOpen, onClose, onNavigate, onAddTask }: MenuDrawerProps) {
  const menuItems = [
    {
      id: "task",
      label: "Current Task",
      icon: <Home className="w-5 h-5 text-cyan-400" />,
      onClick: () => {
        onNavigate("task")
        onClose()
      },
    },
    {
      id: "addTask",
      label: "Add Task",
      icon: <Plus className="w-5 h-5 text-emerald-400" />,
      onClick: () => {
        if (onAddTask) onAddTask()
        onClose()
      },
    },
    {
      id: "taskList",
      label: "All Tasks",
      icon: <ListTodo className="w-5 h-5 text-blue-400" />,
      onClick: () => {
        onNavigate("taskList")
        onClose()
      },
    },
    {
      id: "habits",
      label: "Habits",
      icon: <Repeat className="w-5 h-5 text-violet-400" />,
      onClick: () => {
        onNavigate("habits")
        onClose()
      },
    },
    {
      id: "dashboard",
      label: "War Room",
      icon: <List className="w-5 h-5 text-purple-400" />,
      onClick: () => {
        onNavigate("dashboard")
        onClose()
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon className="w-5 h-5 text-orange-400" />,
      onClick: () => {
        onNavigate("settings")
        onClose()
      },
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-br from-slate-900 to-slate-800 border-r border-slate-700/50 z-50 p-6 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Navigation - render all items unconditionally */}
            <nav className="space-y-2 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left"
                >
                  {item.icon}
                  <span className="text-slate-200">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-700/50 text-center">
              <span className="text-xs text-slate-600">{MENU_VERSION}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
