"use client"

import { Settings } from "lucide-react"
import type { Task, Suggestion } from "@/lib/types"
import { rankTasks } from "@/lib/types"
import { TaskCard } from "@/components/task-card"
import { ExpiringSection } from "@/components/expiring-section"
import { SuggestionsSection } from "@/components/suggestions-section"

interface HomeScreenProps {
  tasks: Task[]
  suggestions: Suggestion[]
  onTaskSelect: (task: Task) => void
  onTaskAction: (taskId: string, action: string) => void
  onSuggestionAction: (suggestionId: string, action: string) => void
}

export function HomeScreen({ tasks, suggestions, onTaskSelect, onTaskAction, onSuggestionAction }: HomeScreenProps) {
  const rankedTasks = rankTasks(tasks)

  // Your Move is ALWAYS index 0 of the ranked list (identical to Decisions first card)
  const primaryTask = rankedTasks[0]
  const secondaryTasks = rankedTasks.slice(1, 3)

  // Track IDs already shown in Your Move section
  const yourMoveIds = new Set<string>()
  if (primaryTask) yourMoveIds.add(primaryTask.id)
  secondaryTasks.forEach((t) => yourMoveIds.add(t.id))

  // Expiring lists: filter out Your Move items, derive from ranked list
  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const expiringToday = pendingTasks.filter(
    (t) => !yourMoveIds.has(t.id) && t.expiresAt && new Date(t.expiresAt).toDateString() === new Date().toDateString(),
  )
  const expiringSoon = pendingTasks.filter(
    (t) =>
      !yourMoveIds.has(t.id) &&
      t.expiresAt &&
      new Date(t.expiresAt) > new Date() &&
      new Date(t.expiresAt).toDateString() !== new Date().toDateString(),
  )
  const alreadyExpired = pendingTasks.filter(
    (t) =>
      !yourMoveIds.has(t.id) &&
      t.expiresAt &&
      new Date(t.expiresAt) < new Date() &&
      new Date(t.expiresAt).toDateString() !== new Date().toDateString(),
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Today</h1>
          <p className="text-sm text-muted-foreground mt-1">Your next move</p>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <div className="px-6 space-y-12">
        {/* Your Move - Primary Task */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Your Move</h2>
          {primaryTask ? (
            <TaskCard
              task={primaryTask}
              variant="primary"
              onSelect={() => onTaskSelect(primaryTask)}
              onAction={(action) => onTaskAction(primaryTask.id, action)}
            />
          ) : (
            <div className="bg-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground">No pending tasks</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Capture something to get started</p>
            </div>
          )}

          {secondaryTasks.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {secondaryTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="secondary"
                  onSelect={() => onTaskSelect(task)}
                  onAction={(action) => onTaskAction(task.id, action)}
                />
              ))}
            </div>
          )}
        </section>

        <ExpiringSection
          expiringToday={[...alreadyExpired, ...expiringToday]}
          expiringSoon={expiringSoon}
          onTaskAction={onTaskAction}
        />

        {/* Suggestions */}
        <SuggestionsSection suggestions={suggestions} onAction={onSuggestionAction} />
      </div>
    </div>
  )
}
