import { NextRequest, NextResponse } from "next/server"

interface ParseTaskRequest {
  input: string
  inputType: "voice" | "text" | "title"
  context?: {
    currentTime: string
    userTimezone: string
    recentTasks?: string[]
  }
}

const SYSTEM_PROMPT = `You are a task parsing assistant for a productivity app designed to reduce decision fatigue. Your job is to extract structured task data from natural language input.

CORE PRINCIPLES:
1. Make the task title ACTIONABLE - start with a verb when possible
2. Infer reasonable defaults - users shouldn't need to specify everything
3. When uncertain, choose the option that creates least pressure (medium priority, normal energy, reasonable time)
4. Detect emotional signals that indicate energy/resistance levels

FIELD EXTRACTION RULES:

## Title
- Extract or generate a clear, actionable title
- Start with action verbs: Submit, Call, Review, Write, Schedule, Fix, Send, Complete, Prepare, Research
- Keep under 50 characters when possible
- Remove filler words and hesitation markers

## Priority
Infer from these signals:
- HIGH: explicit urgency ("asap", "urgent", "today", "overdue"), external deadlines, mentions of waiting/blocking others, financial/legal implications
- MEDIUM: moderate time pressure ("this week", "soon"), standard work tasks, routine but necessary items
- LOW: "whenever", "eventually", "might", "should probably", nice-to-haves, personal/optional tasks

## Energy Required
Infer from task TYPE and EMOTIONAL SIGNALS:

Peak Energy tasks (requires focus, creativity, or emotional labor):
- Deep work: writing, coding, designing, strategizing
- Difficult conversations: confrontation, negotiation, firing
- High-stakes: presentations, interviews, important meetings
- Creative work: brainstorming, problem-solving

Normal Energy tasks (standard cognitive load):
- Administrative: emails, scheduling, organizing
- Routine work: status updates, standard meetings
- Light research or reading
- Most phone calls

Low Energy tasks (can do when tired):
- Rote tasks: data entry, filing, copying
- Simple errands: picking up items, dropping off
- Passive tasks: waiting for something, monitoring
- Quick wins: small fixes, simple replies

EMOTIONAL SIGNALS that affect energy:
- Resistance markers ("dreading", "ugh", "hate doing", "putting off") → suggests task feels harder than it is objectively, may need PEAK to overcome resistance
- Excitement markers ("excited", "can't wait", "looking forward") → may lower energy requirement
- Anxiety markers ("nervous", "worried about") → likely PEAK for emotional labor

## Estimated Time
Use these patterns:
- 15: Quick calls, simple emails, tiny tasks, single-step actions
- 25: Standard tasks, focused work sessions, routine admin (DEFAULT)
- 45: Medium complexity, multiple steps, requires some research
- 60: Significant work, writing/creating, complex problems
- 90: Deep work sessions, major deliverables, extensive research

## Deadline
- Extract explicit dates/times
- Interpret relative dates ("tomorrow", "next Friday", "end of week")
- "Today" tasks get today's date
- If no deadline mentioned, return null (don't invent urgency)

RESPONSE FORMAT:
Always respond with valid JSON matching this exact structure:
{
  "task": {
    "title": "string",
    "description": "string or null",
    "priority": "high" | "medium" | "low",
    "energy": "peak" | "normal" | "low",
    "estimatedMinutes": 15 | 25 | 45 | 60 | 90,
    "deadline": "ISO date string or null"
  },
  "confidence": {
    "overall": 0-1,
    "fields": {
      "priority": 0-1,
      "energy": 0-1,
      "time": 0-1,
      "deadline": 0-1
    }
  },
  "reasoning": "Brief explanation",
  "additionalTasksDetected": ["array of other tasks mentioned, if any"]
}`

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeParseResult(result: Record<string, unknown>) {
  const validPriorities = ["high", "medium", "low"]
  const validEnergies = ["peak", "normal", "low"]
  const validTimes = [15, 25, 45, 60, 90]

  const task = result.task as Record<string, unknown> | undefined
  const confidence = result.confidence as Record<string, unknown> | undefined
  const fields = confidence?.fields as Record<string, number> | undefined

  return {
    task: {
      title: (task?.title as string) || "Untitled task",
      description: (task?.description as string) || null,
      priority: validPriorities.includes(task?.priority as string)
        ? (task?.priority as "high" | "medium" | "low")
        : "medium",
      energy: validEnergies.includes(task?.energy as string)
        ? (task?.energy as "peak" | "normal" | "low")
        : "normal",
      estimatedMinutes: validTimes.includes(task?.estimatedMinutes as number)
        ? (task?.estimatedMinutes as 15 | 25 | 45 | 60 | 90)
        : 25,
      deadline: (task?.deadline as string) || null,
    },
    confidence: {
      overall: clamp((confidence?.overall as number) ?? 0.5, 0, 1),
      fields: {
        priority: clamp(fields?.priority ?? 0.5, 0, 1),
        energy: clamp(fields?.energy ?? 0.5, 0, 1),
        time: clamp(fields?.time ?? 0.5, 0, 1),
        deadline: clamp(fields?.deadline ?? 1, 0, 1),
      },
    },
    reasoning: (result.reasoning as string) || "",
    additionalTasksDetected: (result.additionalTasksDetected as string[]) || [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseTaskRequest = await request.json()
    const { input, inputType, context } = body

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input is required" }, { status: 400 })
    }

    const userPrompt = `Parse this task input and extract structured data.

INPUT TYPE: ${inputType || "text"}
RAW INPUT: "${input}"

CURRENT CONTEXT:
- Current time: ${context?.currentTime || new Date().toISOString()}
- Timezone: ${context?.userTimezone || "UTC"}
- Recent tasks: ${context?.recentTasks?.join(", ") || "none provided"}

Return JSON with the task data, confidence scores (0-1 for each field), and brief reasoning.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("OpenAI API error:", error)
      return NextResponse.json({ error: "Failed to parse task" }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    const result = JSON.parse(content)
    const normalizedResult = normalizeParseResult(result)

    return NextResponse.json(normalizedResult)
  } catch (error) {
    console.error("Task parsing error:", error)
    return NextResponse.json({ error: "Failed to parse task" }, { status: 500 })
  }
}
