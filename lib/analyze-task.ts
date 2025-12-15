import type { TaskAnalysis, BestTimeBucket } from "./types"

// Client helper to call AI analysis
export async function analyzeTask(rawText: string): Promise<TaskAnalysis> {
  const res = await fetch("/api/analyze-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }),
  })

  if (!res.ok) {
    throw new Error("Failed to analyze task")
  }

  return (await res.json()) as TaskAnalysis
}

// Helper to format best time for display
export function prettyBestTime(bucket: BestTimeBucket): string {
  switch (bucket) {
    case "now":
      return "Do it now"
    case "morning_meeting_window":
      return "Morning meeting window"
    case "focus_block":
      return "Focus block"
    case "evening_wind_down":
      return "Evening wind down"
    case "weekend":
      return "Weekend"
    default:
      return "Anytime"
  }
}
