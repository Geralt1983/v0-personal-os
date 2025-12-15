"use client"

import type { Task } from "@/lib/types"
import { generateRecommendation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useState } from "react"

interface TaskDetailScreenProps {
  task: Task
  onBack: () => void
  onAction: (taskId: string, action: string) => void
}

function formatEffortDecision(task: Task): string | null {
  if (!task.etaMinutes) return null

  if (task.vendorCandidate) {
    const hireTime = Math.ceil(task.etaMinutes * 0.3)
    return `${task.etaMinutes} min self or ~${hireTime} min to hire out`
  }
  if (task.delegateCandidate) {
    return `${task.etaMinutes} min self or delegate in 2 min`
  }
  return `${task.etaMinutes} min`
}

export function TaskDetailScreen({ task, onBack, onAction }: TaskDetailScreenProps) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const recommendation = generateRecommendation(task)
  const effortDisplay = formatEffortDecision(task)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground leading-snug">{task.title}</h1>
      </header>

      <div className="px-6 space-y-8">
        {/* Original Text (Collapsible) */}
        {task.originalText && (
          <div>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showOriginal ? "rotate-180" : ""}`} />
              <span className="text-sm">Original text</span>
            </button>
            {showOriginal && <p className="text-sm text-muted-foreground mt-2 pl-6 italic">"{task.originalText}"</p>}
          </div>
        )}

        {/* AI Insights - only Effort and Pattern */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">AI Insights</h2>
          <div className="space-y-3">
            {effortDisplay && (
              <div className="text-sm">
                <span className="text-muted-foreground/60 text-xs uppercase tracking-wide">Effort</span>
                <p className="text-foreground mt-0.5">{effortDisplay}</p>
              </div>
            )}
            {task.patternMatch && (
              <div className="text-sm">
                <span className="text-muted-foreground/60 text-xs uppercase tracking-wide">Pattern</span>
                <p className="text-foreground mt-0.5">{task.patternMatch}</p>
              </div>
            )}
          </div>
        </section>

        {recommendation && (
          <div className="bg-card/50 border border-border/50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">Recommendation</p>
            <p className="text-sm text-foreground">{recommendation.reason}</p>
          </div>
        )}

        {/* Actions - reorganized into 3 rows */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Actions</h2>
          <div className="space-y-3">
            {/* Row 1: Do / Schedule / Defer */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => onAction(task.id, "do")}
                className={`h-12 ${recommendation?.action === "do" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              >
                Do now
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAction(task.id, "schedule")}
                className={`h-12 ${recommendation?.action === "schedule" ? "ring-2 ring-muted-foreground/50 ring-offset-2 ring-offset-background" : ""}`}
              >
                Schedule
              </Button>
              <Button variant="secondary" onClick={() => onAction(task.id, "defer")} className="h-12">
                Defer
              </Button>
            </div>
            {/* Row 2: Break down / Delegate / Hire out */}
            <div className="grid grid-cols-3 gap-3">
              <Button variant="secondary" onClick={() => onAction(task.id, "breakdown")} className="h-12">
                Break down
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAction(task.id, "delegate")}
                className={`h-12 ${recommendation?.action === "delegate" ? "ring-2 ring-muted-foreground/50 ring-offset-2 ring-offset-background" : ""}`}
              >
                Delegate
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAction(task.id, "hire")}
                className={`h-12 ${recommendation?.action === "hire" ? "ring-2 ring-muted-foreground/50 ring-offset-2 ring-offset-background" : ""}`}
              >
                Hire out
              </Button>
            </div>
            {/* Row 3: Delete (solo, weaker) */}
            <div className="mt-2">
              <button
                onClick={() => onAction(task.id, "delete")}
                className="text-[10px] text-destructive/45 hover:text-destructive/65 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        {task.microMoves && task.microMoves.length > 0 && (
          <section>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
              <span className="text-xs font-medium uppercase tracking-wider">Breakdown</span>
            </button>
            {showBreakdown && (
              <div className="mt-4 space-y-3 pl-6">
                <p className="text-xs text-muted-foreground mb-2">Auto-generated micro moves:</p>
                {task.microMoves.map((move, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    {move}
                  </div>
                ))}
                {task.isHireOutCandidate && (
                  <p className="text-sm text-muted-foreground mt-4">
                    OR <span className="text-foreground">Hire instead</span>
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
