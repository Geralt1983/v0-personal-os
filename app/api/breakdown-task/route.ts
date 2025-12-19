import { generateText } from "ai"

export interface MicroStep {
  title: string
  estimatedMinutes: number
  energyLevel: "low" | "medium" | "peak"
  starterPhrase: string
  completionCue: string
}

export async function POST(request: Request) {
  try {
    const { title, description, userEnergy, taskContext } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You are an executive function coach specializing in ADHD. Your job is to eliminate decision paralysis by breaking tasks into the SMALLEST possible physical actions.

CRITICAL RULES:
1. First step MUST be under 2 minutes and require ZERO decisions
2. "starterPhrase" = the exact PHYSICAL action to begin (verb + object)
3. "completionCue" = how they know this step is done
4. Never use vague verbs: research, figure out, handle, work on, look into
5. Each step should be so small it feels almost silly

RESPOND ONLY WITH VALID JSON - no markdown, no explanation:
[
  {
    "title": "string - the micro-task name",
    "estimatedMinutes": number (1-15),
    "energyLevel": "low" | "medium" | "peak",
    "starterPhrase": "string - exact physical action starting with a verb",
    "completionCue": "string - how you know it's done"
  }
]

Good starterPhrases:
- "Pick up your phone"
- "Open the browser and type..."
- "Stand up and walk to..."
- "Say out loud: Hey Siri..."
- "Put your hand on the mouse"

Bad starterPhrases:
- "Research options" (vague)
- "Think about..." (not physical)
- "Decide on..." (requires decision)
- "Work on..." (undefined scope)`,

      prompt: `Break this task into 3-5 micro-steps for someone with ADHD who is overwhelmed:

TASK: "${title}"
${description ? `CONTEXT: "${description}"` : ""}
${taskContext ? `ADDITIONAL INFO: "${taskContext}"` : ""}

USER'S CURRENT ENERGY: ${userEnergy || "medium"}

Requirements:
- First step must be trivially easy (picking up phone, opening app)
- Match step energy to user's current state: ${userEnergy || "medium"}
- Include physical "starter phrase" for each step
- Include "completion cue" so they know when to move on`,
    })

    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()

    let steps: MicroStep[]
    try {
      steps = JSON.parse(cleanedText)
    } catch {
      // Fallback: generate simple steps
      steps = [
        {
          title: `Start: ${title}`,
          estimatedMinutes: 2,
          energyLevel: "low",
          starterPhrase: "Open the app or tool you need",
          completionCue: "The app is open on your screen",
        },
        {
          title: `Do: ${title}`,
          estimatedMinutes: 10,
          energyLevel: (userEnergy as "low" | "medium" | "peak") || "medium",
          starterPhrase: "Begin the main action",
          completionCue: "The task is complete",
        },
      ]
    }

    // Validate and sanitize
    steps = steps.map((step, index) => ({
      title: step.title || `Step ${index + 1}`,
      estimatedMinutes: Math.min(15, Math.max(1, step.estimatedMinutes || 5)),
      energyLevel: step.energyLevel || "medium",
      starterPhrase: step.starterPhrase || "Begin this step",
      completionCue: step.completionCue || "Move to next step when ready",
    }))

    return Response.json({
      steps,
      totalMinutes: steps.reduce((sum, s) => sum + s.estimatedMinutes, 0),
    })
  } catch (err) {
    console.error("[LifeOS] breakdown-task error", err)
    return Response.json({ error: "Failed to break down task" }, { status: 500 })
  }
}
