import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json()

    if (!rawText || typeof rawText !== "string") {
      return Response.json({ error: "rawText is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You rephrase and classify personal tasks for a busy consultant and parent who runs 4 jobs and a family. 

RESPOND ONLY WITH VALID JSON, no markdown, no explanation.

The JSON must have this exact structure:
{
  "rewrittenTitle": "string - clear, actionable task title",
  "context": "Work" | "Home" | "Money" | "Family" | "Health" | "Admin" | "Other",
  "tags": ["array of strings like Quick win, Deep work, Vendor, Delegate, etc."],
  "etaMinutes": number between 1 and 240,
  "bestTime": "now" | "morning_meeting_window" | "focus_block" | "evening_wind_down" | "weekend" | "anytime",
  "friction": "low" | "medium" | "high",
  "size": "tiny" | "small" | "medium" | "large",
  "delegateCandidate": boolean,
  "vendorCandidate": boolean,
  "quickWin": boolean
}

Tag guidelines:
- "Quick win" for tasks under 10 minutes
- "Deep work" for focused tasks requiring concentration
- "Vendor" if it could be hired out (handyman, cleaner, etc.)
- "Delegate" if it could be assigned to family or assistant

Best time guidelines:
- "now" for urgent or very quick tasks
- "morning_meeting_window" for calls, meetings, coordination
- "focus_block" for deep work requiring concentration  
- "evening_wind_down" for lighter tasks, planning, admin
- "weekend" for larger projects or family activities
- "anytime" for flexible tasks`,
      prompt: `Analyze and classify this task: "${rawText}"`,
    })

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleanedText)

    // Ensure required fields have correct types
    const result = {
      rewrittenTitle: String(parsed.rewrittenTitle || rawText),
      context: parsed.context || "Other",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      etaMinutes: Math.min(240, Math.max(1, Number.parseInt(parsed.etaMinutes) || 15)),
      bestTime: parsed.bestTime || "anytime",
      friction: parsed.friction || "medium",
      size: parsed.size || "small",
      delegateCandidate: Boolean(parsed.delegateCandidate),
      vendorCandidate: Boolean(parsed.vendorCandidate),
      quickWin: Boolean(parsed.quickWin),
    }

    return Response.json(result)
  } catch (err) {
    console.error("analyze-task error", err)
    return Response.json({ error: "AI analysis failed" }, { status: 500 })
  }
}
