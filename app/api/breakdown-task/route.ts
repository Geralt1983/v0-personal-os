import { aiService } from "@/lib/ai"
import type { EnergyLevel } from "@/lib/ai/types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:BreakdownTask")

export async function POST(request: Request) {
  try {
    const { title, description, userEnergy } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await aiService.breakdownTask(
      title,
      description,
      (userEnergy as EnergyLevel) || "medium"
    )

    return Response.json(result)
  } catch (err) {
    logger.error("Task breakdown failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to break down task" }, { status: 500 })
  }
}
