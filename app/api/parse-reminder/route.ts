import type { NextRequest } from "next/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Extract reminder details from this natural language input. Return ONLY valid JSON with this exact structure:
{
  "task": "the action to do (capitalize properly, remove 'remind me to' prefixes)",
  "date": "specific date or relative time like 'tomorrow', 'Monday', 'Dec 15', or null if not mentioned",
  "time": "specific time in 12hr format like '2:00 PM' or null if not mentioned",
  "relative": "relative duration like 'in 2 hours', 'in 30 min' or null if not mentioned"
}

Input: "${text}"

Remember: Return ONLY the JSON object, no other text.`,
    })

    let cleanedResult = result.trim()
    if (cleanedResult.startsWith("```json")) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, "").replace(/```\s*$/, "")
    } else if (cleanedResult.startsWith("```")) {
      cleanedResult = cleanedResult.replace(/^```\s*/, "").replace(/```\s*$/, "")
    }

    // Parse the JSON response
    const parsed = JSON.parse(cleanedResult)
    return Response.json(parsed)
  } catch (error) {
    console.error("Parse reminder error:", error)
    return Response.json({ error: "Failed to parse reminder" }, { status: 500 })
  }
}
