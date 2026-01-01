"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Home, SettingsIcon, List, ListTodo, Plus, Repeat, ChevronRight, Sparkles } from "lucide-react"

const MENU_VERSION = "v2.2"

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
      label: "Focus Mode",
      description: "Current task",
      icon: <Home className="w-5 h-5" />,
      iconBg: "from-cyan-500/20 to-blue-600/20",
      iconColor: "text-accent-cyan",
      onClick: () => {
        onNavigate("task")
        onClose()
      },
    },
    {
      id: "addTask",
      label: "Add Task",
      description: "Create new",
      icon: <Plus className="w-5 h-5" />,
      iconBg: "from-emerald-500/20 to-green-600/20",
      iconColor: "text-emerald-400",
      onClick: () => {
        if (onAddTask) onAddTask()
        onClose()
      },
    },
    {
      id: "taskList",
      label: "All Tasks",
      description: "View & manage",
      icon: <ListTodo className="w-5 h-5" />,
      iconBg: "from-blue-500/20 to-indigo-600/20",
      iconColor: "text-blue-400",
      onClick: () => {
        onNavigate("taskList")
        onClose()
      },
    },
    {
      id: "habits",
      label: "Habits",
      description: "Daily routines",
      icon: <Repeat className="w-5 h-5" />,
      iconBg: "from-violet-500/20 to-purple-600/20",
      iconColor: "text-violet-400",
      onClick: () => {
        onNavigate("habits")
        onClose()
      },
    },
    {
      id: "dashboard",
      label: "War Room",
      description: "Analytics",
      icon: <List className="w-5 h-5" />,
      iconBg: "from-purple-500/20 to-pink-600/20",
      iconColor: "text-purple-400",
      onClick: () => {
        onNavigate("dashboard")
        onClose()
      },
    },
    {
      id: "settings",
      label: "Settings",
      description: "Preferences",
      icon: <SettingsIcon className="w-5 h-5" />,
      iconBg: "from-orange-500/20 to-amber-600/20",
      iconColor: "text-orange-400",
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
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-0 top-0 bottom-0 w-80 z-50 flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(12, 16, 21, 0.98) 0%, rgba(8, 10, 14, 0.98) 100%)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "20px 0 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.03)",
            }}
          >
            {/* Ambient glow inside drawer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />
              <div
                className="absolute bottom-1/4 -right-10 w-40 h-40 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(191, 127, 255, 0.08) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-white/10"
                  animate={{
                    boxShadow: ["0 0 0 rgba(0, 229, 255, 0)", "0 0 20px rgba(0, 229, 255, 0.2)", "0 0 0 rgba(0, 229, 255, 0)"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-accent-cyan" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">LifeOS</h2>
                  <p className="text-xs text-text-tertiary">Your productivity hub</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl glass-card-sm hover:border-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-text-secondary" />
              </motion.button>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Navigation */}
            <nav className="relative z-10 flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={item.onClick}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="w-full group flex items-center gap-4 px-4 py-3.5 rounded-2xl glass-card-sm hover:border-white/15 transition-all duration-300"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.iconBg} border border-white/10 ${item.iconColor} transition-all duration-300 group-hover:border-white/20`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block text-sm font-semibold text-white group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <span className="block text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                      {item.description}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                </motion.button>
              ))}
            </nav>

            {/* Footer */}
            <div className="relative z-10 p-6 pt-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Version {MENU_VERSION}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400/70">Connected</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
