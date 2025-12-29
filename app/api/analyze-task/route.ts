import { aiService } from "@/lib/ai"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:AnalyzeTask")

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json()

    if (!rawText || typeof rawText !== "string") {
      return Response.json({ error: "rawText is required" }, { status: 400 })
    }

    const result = await aiService.analyzeTask(rawText)
    return Response.json(result)
  } catch (err) {
    logger.error("Task analysis failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "AI analysis failed" }, { status: 500 })
  }
}
