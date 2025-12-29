import type { NextRequest } from "next/server"
import { aiService } from "@/lib/ai"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:ParseReminder")

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const result = await aiService.parseReminder(text)
    return Response.json(result)
  } catch (error) {
    logger.error("Parse reminder failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return Response.json({ error: "Failed to parse reminder" }, { status: 500 })
  }
}
