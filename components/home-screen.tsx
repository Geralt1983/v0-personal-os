"use client"

import { motion } from "framer-motion"
import { Settings, Sparkles, Calendar } from "lucide-react"
import type { Task, Suggestion } from "@/lib/types"
import { TaskCard } from "@/components/task-card"
import { ExpiringSection } from "@/components/expiring-section"
import { SuggestionsSection } from "@/components/suggestions-section"

// Ambient floating particles component
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large ambient orbs */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          left: '-15%',
          top: '10%',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          right: '-10%',
          bottom: '20%',
          background: 'radial-gradient(circle, rgba(191, 127, 255, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -25, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          right: '30%',
          top: '40%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

function getGreeting(): { greeting: string; icon: string } {
  const hour = new Date().getHours()
  if (hour < 5) return { greeting: "Night owl", icon: "🦉" }
  if (hour < 12) return { greeting: "Good morning", icon: "☀️" }
  if (hour < 17) return { greeting: "Good afternoon", icon: "🌤️" }
  if (hour < 21) return { greeting: "Good evening", icon: "🌙" }
  return { greeting: "Good night", icon: "✨" }
}

interface HomeScreenProps {
  tasks: Task[]
  suggestions: Suggestion[]
  onTaskSelect: (task: Task) => void
  onTaskAction: (taskId: string, action: string) => void
  onSuggestionAction: (suggestionId: string, action: string) => void
}

export function HomeScreen({ tasks, suggestions, onTaskSelect, onTaskAction, onSuggestionAction }: HomeScreenProps) {
  const primaryTask = tasks[0]
  const secondaryTasks = tasks.slice(1, 3)
  const expiringToday = tasks.filter(
    (t) => t.expiresAt && new Date(t.expiresAt).toDateString() === new Date().toDateString(),
  )
  const expiringSoon = tasks.filter(
    (t) =>
      t.expiresAt &&
      new Date(t.expiresAt) > new Date() &&
      new Date(t.expiresAt).toDateString() !== new Date().toDateString(),
  )

  const { greeting, icon } = getGreeting()

  return (
    <>
      <AmbientBackground />
      <div className="min-h-screen bg-bg-base pb-24 relative z-10">
        {/* Premium Header */}
        <header className="px-6 pt-12 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start justify-between"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-text-secondary">{greeting}</span>
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Today
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-text-secondary mt-2 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-2xl glass-card-sm hover:border-white/20 transition-all duration-300"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
            </motion.button>
          </motion.div>
        </header>

        <div className="px-6 space-y-12">
          {/* Your Move - Primary Task */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2 mb-5">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4 text-accent-cyan" />
              </motion.div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan">
                Your Move
              </h2>
            </div>

            {primaryTask ? (
              <>
                <TaskCard
                  task={primaryTask}
                  variant="primary"
                  onSelect={() => onTaskSelect(primaryTask)}
                  onAction={(action) => onTaskAction(primaryTask.id, action)}
                />

                {secondaryTasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="grid grid-cols-2 gap-3 mt-5"
                  >
                    {secondaryTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                      >
                        <TaskCard
                          task={task}
                          variant="secondary"
                          onSelect={() => onTaskSelect(task)}
                          onAction={(action) => onTaskAction(task.id, action)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-premium p-10 text-center"
              >
                <motion.div
                  className="text-5xl mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🎉
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                <p className="text-text-secondary">You've completed all your tasks. Nice work!</p>
              </motion.div>
            )}
          </motion.section>

          {/* Expiring */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <ExpiringSection expiringToday={expiringToday} expiringSoon={expiringSoon} onTaskAction={onTaskAction} />
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <SuggestionsSection suggestions={suggestions} onAction={onSuggestionAction} />
          </motion.div>
        </div>
      </div>
    </>
  )
}
