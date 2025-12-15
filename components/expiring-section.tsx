"use client"

import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ExpiringSectionProps {
  expiringToday: Task[]
  expiringSoon: Task[]
  onTaskAction: (taskId: string, action: string) => void
}

function getTimeConfig(recommendation?: string): { textColor: string; barColor: string } {
  if (!recommendation) return { textColor: "text-app-text-muted", barColor: "" }
  const lower = recommendation.toLowerCase()
  if (lower.includes("now")) return { textColor: "text-time-now", barColor: "#22c55e" }
  if (lower.includes("morning") || lower.includes("am")) return { textColor: "text-time-morning", barColor: "#fbbf24" }
  if (lower.includes("focus") || lower.includes("deep")) return { textColor: "text-time-focus", barColor: "#a855f7" }
  if (lower.includes("evening") || lower.includes("pm") || lower.includes("night"))
    return { textColor: "text-time-evening", barColor: "#3b82f6" }
  return { textColor: "text-app-text-muted", barColor: "" }
}

export function ExpiringSection({ expiringToday, expiringSoon, onTaskAction }: ExpiringSectionProps) {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())

  if (expiringToday.length === 0 && expiringSoon.length === 0) return null

  const handleAction = (taskId: string, action: string) => {
    if (action === "do") {
      setCompletingIds((prev) => new Set(prev).add(taskId))
      setTimeout(() => onTaskAction(taskId, action), 150)
    } else {
      onTaskAction(taskId, action)
    }
  }

  const isExpired = (task: Task) => {
    if (!task.expiresAt) return false
    return new Date(task.expiresAt) < new Date()
  }

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-7">
        <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-app-text-muted">Expiring</h2>
      </div>

      <div className="space-y-3">
        {expiringToday.map((task) => {
          const timeConfig = getTimeConfig(task.aiRecommendation)
          const expired = isExpired(task)
          const daysAgo = expired
            ? Math.abs(Math.floor((new Date(task.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 0

          return (
            <div
              key={task.id}
              className={`card-surface px-5 py-5 relative overflow-hidden ${completingIds.has(task.id) ? "animate-task-resolve" : ""}`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] ${expired ? "bg-danger" : "bg-danger"} animate-fade-border`}
              />

              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    expired ? "text-danger bg-danger/10" : "text-danger bg-danger/10"
                  }`}
                >
                  {expired ? `Expired ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago` : "Expiring Today"}
                </span>
              </div>

              <h3 className="text-sm font-medium text-app-text">{task.title}</h3>

              {task.aiRecommendation && (
                <div className="mt-1.5 flex items-center gap-2">
                  {timeConfig.barColor && (
                    <div
                      style={{
                        width: "3px",
                        height: "12px",
                        borderRadius: "9999px",
                        backgroundColor: timeConfig.barColor,
                      }}
                    />
                  )}
                  <p className={`text-[10px] ${timeConfig.textColor}`}>{task.aiRecommendation}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleAction(task.id, "do")}
                  className="bg-neutral-100 text-black hover:bg-white font-medium px-5 py-2"
                >
                  Do
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "schedule")}
                  className="bg-neutral-900 text-app-text-soft px-5 py-2"
                >
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "delegate")}
                  className="bg-neutral-900 text-app-text-soft px-5 py-2"
                >
                  Delegate
                </Button>
              </div>

              <button
                onClick={() => handleAction(task.id, "delete")}
                className="text-[8px] text-app-text-muted/40 hover:text-app-text-muted/60 mt-4 transition-colors select-none"
              >
                Delete
              </button>
            </div>
          )
        })}

        {expiringSoon.map((task) => {
          const timeConfig = getTimeConfig(task.aiRecommendation)
          return (
            <div
              key={task.id}
              className={`card-surface px-5 py-5 relative overflow-hidden ${completingIds.has(task.id) ? "animate-task-resolve" : ""}`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-warning/60 animate-fade-border" />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-warning/80">Expiring Soon</span>
              </div>

              <h3 className="text-sm font-medium text-app-text">{task.title}</h3>

              {task.aiRecommendation && (
                <div className="mt-1.5 flex items-center gap-2">
                  {timeConfig.barColor && (
                    <div
                      style={{
                        width: "3px",
                        height: "12px",
                        borderRadius: "9999px",
                        backgroundColor: timeConfig.barColor,
                      }}
                    />
                  )}
                  <p className={`text-[10px] ${timeConfig.textColor}`}>{task.aiRecommendation}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleAction(task.id, "do")}
                  className="bg-neutral-100 text-black hover:bg-white font-medium px-5 py-2"
                >
                  Do
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "schedule")}
                  className="bg-neutral-900 text-app-text-soft px-5 py-2"
                >
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "defer")}
                  className="bg-neutral-900 text-app-text-soft px-5 py-2"
                >
                  Defer
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
