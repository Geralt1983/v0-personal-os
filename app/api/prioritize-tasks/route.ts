import { aiService } from "@/lib/ai"
import type { UserContext } from "@/lib/ai/types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:PrioritizeTasks")

export async function POST(request: Request) {
  try {
    const { tasks, userContext } = await request.json()

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return Response.json({ error: "Tasks array is required" }, { status: 400 })
    }

    const context: UserContext = {
      currentEnergy: userContext?.currentEnergy || "medium",
      timeOfDay: userContext?.timeOfDay || getTimeOfDay(),
      availableMinutes: userContext?.availableMinutes || 60,
      recentCompletions: userContext?.recentCompletions || [],
      currentMood: userContext?.currentMood,
    }

    const result = await aiService.prioritizeTasks(tasks, context)
    return Response.json(result)
  } catch (err) {
    logger.error("Task prioritization failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to prioritize tasks" }, { status: 500 })
  }
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}
