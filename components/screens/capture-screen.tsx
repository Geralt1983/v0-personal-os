"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { analyzeTask, prettyBestTime } from "@/lib/analyze-task"
import type { TaskAnalysis } from "@/lib/types"

interface CaptureScreenProps {
  onCapture: (text: string, analysis: TaskAnalysis | null) => void
}

function frictionLabel(friction: string): { text: string; color: string } {
  switch (friction) {
    case "low":
      return { text: "Low friction", color: "text-time-now" }
    case "medium":
      return { text: "Medium friction", color: "text-time-morning" }
    case "high":
      return { text: "High friction", color: "text-danger" }
    default:
      return { text: friction, color: "text-muted-foreground" }
  }
}

export function CaptureScreen({ onCapture }: CaptureScreenProps) {
  const [input, setInput] = useState("")
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!input.trim() || input.trim().length < 5) {
      setAnalysis(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const handle = setTimeout(async () => {
      try {
        const result = await analyzeTask(input)
        setAnalysis(result)
      } catch (e) {
        console.error(e)
        setError("Could not analyze right now")
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }, 600)

    return () => clearTimeout(handle)
  }, [input])

  const canSubmit = input.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onCapture(input, analysis)
    setInput("")
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-12 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Capture</h1>
        <p className="text-sm text-muted-foreground mt-1">Dump it here. The AI will sort it out.</p>
      </header>

      <div className="px-6">
        <div className="space-y-6">
          <div>
            <label className="sr-only">What&apos;s on your mind</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's on your mind..."
              className="w-full h-32 bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-ring text-lg leading-relaxed"
            />
            {!input.trim() && (
              <p className="text-[11px] text-muted-foreground/40 mt-2 leading-relaxed">
                You can paste email snippets, random brain dump, or screenshot text. I&apos;ll turn it into moves.
              </p>
            )}
          </div>

          {input.trim().length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Rewrite preview
              </p>
              <div className="border border-border/50 rounded-xl p-4 bg-card/50 space-y-2">
                {loading && <p className="text-xs text-muted-foreground">Thinking...</p>}
                {!loading && analysis && (
                  <>
                    <p className="text-foreground font-medium leading-snug">{analysis.rewrittenTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.context}
                      {analysis.tags.length > 0 && " · "}
                      {analysis.tags.slice(0, 3).join(" · ")}
                    </p>
                    <p className="text-xs">
                      <span className={frictionLabel(analysis.friction).color}>
                        {frictionLabel(analysis.friction).text}
                      </span>
                      <span className="text-muted-foreground/50"> · </span>
                      <span className="text-muted-foreground/70">
                        Best time: {prettyBestTime(analysis.bestTime)} · ETA {analysis.etaMinutes} min
                      </span>
                    </p>
                    {analysis.quickWin && <p className="text-xs text-time-now mt-1">Quick win — do it now</p>}
                    {!analysis.quickWin && analysis.friction === "high" && analysis.vendorCandidate && (
                      <p className="text-xs text-muted-foreground/60 mt-1">High friction. Consider hiring out.</p>
                    )}
                    {!analysis.quickWin && analysis.friction !== "high" && analysis.vendorCandidate && (
                      <p className="text-xs text-muted-foreground/60 mt-1">Candidate for hiring out</p>
                    )}
                    {!analysis.quickWin && !analysis.vendorCandidate && analysis.delegateCandidate && (
                      <p className="text-xs text-muted-foreground/60 mt-1">Could be delegated</p>
                    )}
                  </>
                )}
                {!loading && !analysis && !error && (
                  <p className="text-xs text-muted-foreground/60">I&apos;ll classify this once you pause typing.</p>
                )}
                {error && <p className="text-xs text-danger">{error}</p>}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className={`w-full h-14 text-base transition-all duration-300 ${
              canSubmit ? "shadow-lg shadow-primary/20 hover:shadow-primary/30" : ""
            }`}
          >
            Add to OS
          </Button>
        </div>
      </div>
    </div>
  )
}
