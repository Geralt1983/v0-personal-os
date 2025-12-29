import { aiService } from "@/lib/ai"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DailyReview")

export async function POST(request: Request) {
  try {
    const { completedTasks, incompleteTasks, notes } = await request.json()

    if (!Array.isArray(completedTasks)) {
      return Response.json({ error: "completedTasks array is required" }, { status: 400 })
    }

    const result = await aiService.generateDailyReview(
      completedTasks,
      incompleteTasks || [],
      notes
    )

    return Response.json(result)
  } catch (err) {
    logger.error("Daily review generation failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to generate daily review" }, { status: 500 })
  }
}
