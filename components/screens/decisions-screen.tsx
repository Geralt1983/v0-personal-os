"use client"

import type { Task, BestTimeBucket } from "@/lib/types"
import { rankTasks, generateRecommendation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { prettyBestTime } from "@/lib/analyze-task"

interface DecisionsScreenProps {
  tasks: Task[]
  onTaskAction: (taskId: string, action: string) => void
}

function getTimeConfig(
  bestTime?: BestTimeBucket,
  recommendation?: string,
): { textColor: string; barColor: string; label: string } {
  if (bestTime) {
    switch (bestTime) {
      case "now":
        return { textColor: "text-time-now", barColor: "#22c55e", label: prettyBestTime(bestTime) }
      case "morning_meeting_window":
        return { textColor: "text-time-morning", barColor: "#fbbf24", label: prettyBestTime(bestTime) }
      case "focus_block":
        return { textColor: "text-time-focus", barColor: "#a855f7", label: prettyBestTime(bestTime) }
      case "evening_wind_down":
        return { textColor: "text-time-evening", barColor: "#3b82f6", label: prettyBestTime(bestTime) }
      case "weekend":
        return { textColor: "text-time-evening", barColor: "#3b82f6", label: prettyBestTime(bestTime) }
      default:
        return { textColor: "text-app-text-muted", barColor: "", label: prettyBestTime(bestTime) }
    }
  }

  if (!recommendation) return { textColor: "text-app-text-muted", barColor: "", label: "" }
  const lower = recommendation.toLowerCase()
  if (lower.includes("now")) return { textColor: "text-time-now", barColor: "#22c55e", label: recommendation }
  if (lower.includes("morning") || lower.includes("am"))
    return { textColor: "text-time-morning", barColor: "#fbbf24", label: recommendation }
  if (lower.includes("focus") || lower.includes("deep"))
    return { textColor: "text-time-focus", barColor: "#a855f7", label: recommendation }
  if (lower.includes("evening") || lower.includes("pm") || lower.includes("night"))
    return { textColor: "text-time-evening", barColor: "#3b82f6", label: recommendation }
  return { textColor: "text-app-text-muted", barColor: "", label: recommendation }
}

export function DecisionsScreen({ tasks, onTaskAction }: DecisionsScreenProps) {
  const sortedTasks = rankTasks(tasks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())

  const handleAction = (taskId: string, action: string) => {
    if (action === "do") {
      setCompletingIds((prev) => new Set(prev).add(taskId))
      setTimeout(() => onTaskAction(taskId, action), 150)
    } else {
      onTaskAction(taskId, action)
    }
  }

  const getExpiryInfo = (task: Task) => {
    if (!task.expiresAt) return null
    const now = new Date()
    const expiry = new Date(task.expiresAt)
    const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        text: `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`,
        isExpired: true,
        isHard: true,
      }
    }
    if (diffDays === 0) {
      return { text: "Expires today", isExpired: true, isHard: true }
    }
    return { text: `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`, isExpired: false, isHard: false }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-12 pb-8 select-none cursor-default">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Decisions Pending</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sortedTasks.length} item{sortedTasks.length === 1 ? "" : "s"} need attention
        </p>
      </header>

      <div className="px-6 space-y-0">
        {sortedTasks.map((task, index) => {
          const expiryInfo = getExpiryInfo(task)
          const timeConfig = getTimeConfig(task.bestTime, task.aiRecommendation)
          const titleClass = expiryInfo?.isExpired
            ? "text-base font-medium text-foreground/70 leading-snug"
            : "text-base font-medium text-foreground leading-snug"
          const etaDisplay = task.etaMinutes ? `${task.etaMinutes} min` : task.eta
          const recommendation = generateRecommendation(task)

          return (
            <div
              key={task.id}
              className={`bg-card px-5 py-6 relative overflow-hidden rounded-xl ${completingIds.has(task.id) ? "animate-task-resolve" : ""} ${index < sortedTasks.length - 1 ? "border-b border-border/30 rounded-b-none" : ""} ${index > 0 ? "rounded-t-none border-t-0" : ""}`}
            >
              {expiryInfo?.isHard && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive animate-fade-border" />
              )}

              <h3 className={titleClass}>{task.title}</h3>

              {task.aiTags && task.aiTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  {task.aiTags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`text-[10px] ${
                        tag.toLowerCase() === "quick win"
                          ? "text-muted-foreground font-semibold"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {tag}
                      {i < task.aiTags!.length - 1 && (
                        <span className="ml-1.5 text-muted-foreground/20 text-[6px]">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {timeConfig.label && (
                <div className="mt-2 flex items-center gap-2">
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
                  <p className={`text-[10px] ${timeConfig.textColor}`}>{timeConfig.label}</p>
                </div>
              )}

              {etaDisplay && <p className="text-[10px] text-muted-foreground/50 mt-1">ETA {etaDisplay}</p>}

              {expiryInfo && (
                <p className={`text-xs mt-2 ${expiryInfo.isExpired ? "text-destructive" : "text-muted-foreground/60"}`}>
                  {expiryInfo.text}
                </p>
              )}

              {recommendation && (
                <p className="text-[10px] text-muted-foreground/50 mt-2 italic">{recommendation.reason}</p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-border/50">
                <Button
                  size="sm"
                  onClick={() => handleAction(task.id, "do")}
                  className={`bg-neutral-100 text-black hover:bg-white font-medium px-5 py-2.5 h-auto ${recommendation?.action === "do" ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                >
                  Do
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "schedule")}
                  className={`bg-secondary text-secondary-foreground px-5 py-2.5 h-auto ${recommendation?.action === "schedule" ? "ring-2 ring-muted-foreground/50 ring-offset-1 ring-offset-background" : ""}`}
                >
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "delegate")}
                  className={`bg-secondary text-secondary-foreground px-5 py-2.5 h-auto ${recommendation?.action === "delegate" ? "ring-2 ring-muted-foreground/50 ring-offset-1 ring-offset-background" : ""}`}
                >
                  Delegate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(task.id, "hire")}
                  className={`bg-secondary text-secondary-foreground px-5 py-2.5 h-auto ${recommendation?.action === "hire" ? "ring-2 ring-muted-foreground/50 ring-offset-1 ring-offset-background" : ""}`}
                >
                  Hire
                </Button>
              </div>

              <button
                onClick={() => handleAction(task.id, "delete")}
                className="text-[8px] text-muted-foreground/35 hover:text-muted-foreground/55 mt-5 transition-colors block select-none"
              >
                Delete
              </button>
            </div>
          )
        })}

        {sortedTasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No pending decisions</p>
            <p className="text-sm text-muted-foreground/60 mt-1">You&apos;re all caught up</p>
          </div>
        )}
      </div>
    </div>
  )
}
