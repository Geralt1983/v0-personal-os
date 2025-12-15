"use client"

import type { Task, BestTimeBucket } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { prettyBestTime } from "@/lib/analyze-task"

interface TaskCardProps {
  task: Task
  variant: "primary" | "secondary"
  onSelect: () => void
  onAction: (action: string) => void
}

function getTimeConfig(
  bestTime?: BestTimeBucket,
  recommendation?: string,
): {
  textColor: string
  barColor: string
  label: string
} {
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

  if (lower.includes("now")) {
    return { textColor: "text-time-now", barColor: "#22c55e", label: recommendation }
  }
  if (lower.includes("morning") || lower.includes("am")) {
    return { textColor: "text-time-morning", barColor: "#fbbf24", label: recommendation }
  }
  if (lower.includes("focus") || lower.includes("deep")) {
    return { textColor: "text-time-focus", barColor: "#a855f7", label: recommendation }
  }
  if (lower.includes("evening") || lower.includes("pm") || lower.includes("night")) {
    return { textColor: "text-time-evening", barColor: "#3b82f6", label: recommendation }
  }
  return { textColor: "text-app-text-muted", barColor: "", label: recommendation }
}

function getExpiryStatus(task: Task): { label: string; severity: "expired" | "expiring" | null } | null {
  if (!task.expiresAt) return null
  const now = new Date()
  const expiryDate = new Date(task.expiresAt)
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays)
    return { label: `Expired ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`, severity: "expired" }
  }
  if (diffDays === 0) {
    return { label: "Expiring today", severity: "expiring" }
  }
  if (diffDays <= 2) {
    return { label: `Expiring in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, severity: "expiring" }
  }
  return null
}

export function TaskCard({ task, variant, onSelect, onAction }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const timeConfig = getTimeConfig(task.bestTime, task.aiRecommendation)
  const expiryStatus = getExpiryStatus(task)

  if (variant === "primary") {
    return (
      <div
        className={`card-surface px-5 py-6 cursor-pointer hover:border-app-text-muted/30 transition-all relative overflow-hidden ${isCompleting ? "animate-task-resolve" : ""}`}
        onClick={onSelect}
      >
        {expiryStatus && (
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] ${
              expiryStatus.severity === "expired" ? "bg-danger" : "bg-warning"
            }`}
          />
        )}

        {expiryStatus && (
          <div className="mb-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                expiryStatus.severity === "expired" ? "text-danger bg-danger/10" : "text-warning bg-warning/10"
              }`}
            >
              {expiryStatus.label}
            </span>
          </div>
        )}

        <h3 className="text-base md:text-lg font-semibold text-app-text leading-snug">{task.title}</h3>

        {task.aiTags && task.aiTags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {task.aiTags.slice(0, 4).map((tag, i) => (
              <span
                key={tag}
                className={`text-[10px] tracking-wide ${
                  tag.toLowerCase() === "quick win" ? "text-app-text-soft font-semibold" : "text-app-text-muted/60"
                }`}
              >
                {tag}
                {i < Math.min(task.aiTags!.length, 4) - 1 && (
                  <span className="ml-1.5 text-app-text-muted/20 text-[6px]">•</span>
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
                  height: "14px",
                  borderRadius: "9999px",
                  backgroundColor: timeConfig.barColor,
                }}
              />
            )}
            <p className={`text-xs ${timeConfig.textColor}`}>{timeConfig.label}</p>
          </div>
        )}

        <div className="mt-3 space-y-0.5">
          {task.context && <p className="text-xs text-app-text-soft/70">{task.context}</p>}
          {task.etaMinutes
            ? `${task.etaMinutes} min`
            : task.eta && <p className="text-xs text-app-text-muted/50">ETA {task.eta}</p>}
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-app-border/50">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              setIsCompleting(true)
              setTimeout(() => onAction("do"), 150)
            }}
            className="flex-1 bg-neutral-100 text-black hover:bg-white font-medium py-3 h-auto"
          >
            Do it now
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onAction("decide")
            }}
            className="flex-1 text-app-text-muted hover:text-app-text bg-neutral-900 py-3 h-auto"
          >
            Decide
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`card-surface-soft px-4 py-5 cursor-pointer hover:border-app-text-muted/30 transition-all relative overflow-hidden ${isCompleting ? "animate-task-resolve" : ""}`}
      onClick={onSelect}
    >
      {expiryStatus && (
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] ${
            expiryStatus.severity === "expired" ? "bg-danger" : "bg-warning"
          }`}
        />
      )}

      {expiryStatus && (
        <div className="mb-1.5">
          <span
            className={`text-[10px] font-medium ${
              expiryStatus.severity === "expired" ? "text-danger" : "text-warning"
            }`}
          >
            {expiryStatus.label}
          </span>
        </div>
      )}

      <h3 className="text-sm font-medium text-app-text/90 leading-snug line-clamp-2">{task.title}</h3>

      {timeConfig.label && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {timeConfig.barColor && (
            <div
              style={{
                width: "2px",
                height: "10px",
                borderRadius: "9999px",
                backgroundColor: timeConfig.barColor,
              }}
            />
          )}
          <p className={`text-[10px] ${timeConfig.textColor}`}>{timeConfig.label}</p>
        </div>
      )}

      {task.etaMinutes
        ? `${task.etaMinutes} min`
        : task.eta && <p className="text-[10px] text-app-text-muted/50 mt-1.5">ETA {task.eta}</p>}
    </div>
  )
}
