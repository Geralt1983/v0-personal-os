import { aiService } from "@/lib/ai"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:AnalyzePatterns")

export async function POST(request: Request) {
  try {
    const { taskHistory } = await request.json()

    if (!Array.isArray(taskHistory)) {
      return Response.json({ error: "taskHistory array is required" }, { status: 400 })
    }

    if (taskHistory.length < 5) {
      return Response.json({
        patterns: [],
        message: "Need at least 5 completed tasks to analyze patterns",
      })
    }

    const patterns = await aiService.analyzePatterns(taskHistory)

    return Response.json({ patterns })
  } catch (err) {
    logger.error("Pattern analysis failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to analyze patterns" }, { status: 500 })
  }
}
