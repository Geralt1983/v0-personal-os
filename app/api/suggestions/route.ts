import { generateSuggestions, getSuggestionForContext } from "@/lib/ai/suggestions"
import type { TaskData, UserState } from "@/lib/ai/suggestions"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Suggestions")

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tasks, userState, context, limit = 3 } = body

    // Context-based quick suggestion
    if (context) {
      const suggestion = getSuggestionForContext(
        context,
        userState?.tasksCompletedToday || 0
      )
      return Response.json({ suggestions: [suggestion] })
    }

    // Full suggestion generation
    if (!Array.isArray(tasks)) {
      return Response.json({ error: "Tasks array is required" }, { status: 400 })
    }

    const state: UserState = {
      currentEnergy: userState?.currentEnergy || "medium",
      lastTaskCompletedAt: userState?.lastTaskCompletedAt
        ? new Date(userState.lastTaskCompletedAt)
        : undefined,
      tasksCompletedToday: userState?.tasksCompletedToday || 0,
      currentStreak: userState?.currentStreak || 0,
      blockedTaskIds: userState?.blockedTaskIds || [],
      focusingSince: userState?.focusingSince
        ? new Date(userState.focusingSince)
        : undefined,
    }

    const taskData: TaskData[] = tasks.map((t: Record<string, unknown>) => ({
      id: String(t.id),
      title: String(t.title),
      context: (t.context as TaskData["context"]) || "Other",
      etaMinutes: Number(t.etaMinutes) || 15,
      dueDate: t.dueDate ? new Date(t.dueDate as string) : undefined,
      isQuickWin: Boolean(t.isQuickWin || t.quickWin),
      friction: (t.friction as TaskData["friction"]) || "medium",
      skippedCount: Number(t.skippedCount) || 0,
    }))

    const suggestions = await generateSuggestions(taskData, state, limit)

    return Response.json({ suggestions })
  } catch (err) {
    logger.error("Suggestions generation failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
