import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You break down tasks into 3-5 small, actionable micro-moves.

RESPOND ONLY WITH VALID JSON, no markdown, no explanation.

The JSON must be an array of objects with this structure:
[
  {
    "title": "string - specific action starting with a verb",
    "estimatedMinutes": number between 2 and 30,
    "energyLevel": "low" | "medium" | "peak"
  }
]

Guidelines:
- Each step should be concrete and completable in one sitting
- First step should be the easiest to reduce friction
- Use action verbs: Open, Draft, Send, Call, Research, Write, etc.
- Keep titles under 50 characters
- Total time of all steps should roughly match the original task scope`,
      prompt: `Break down this task into micro-moves:

Task: "${title}"
${description ? `Details: "${description}"` : ""}

Return 3-5 actionable steps.`,
    })

    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    const steps = JSON.parse(cleanedText)

    return Response.json({ steps })
  } catch (err) {
    console.error("[v0] breakdown-task error", err)
    return Response.json({ error: "Failed to break down task" }, { status: 500 })
  }
}
