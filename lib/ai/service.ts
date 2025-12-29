/**
 * LifeOS AI Service
 *
 * Unified AI service using Claude as the primary model.
 * Includes all AI operations: task analysis, breakdown, prioritization, and insights.
 */

import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createLogger } from "@/lib/logger"
import { isFeatureEnabled } from "@/lib/feature-flags"
import type {
  TaskAnalysis,
  TaskBreakdown,
  MicroStep,
  ReminderParsed,
  DailyReview,
  PrioritizationResult,
  UserContext,
  PatternInsight,
  EnergyLevel,
} from "./types"

const logger = createLogger("AI")

export type AIProvider = "claude" | "openai"

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Get the AI model based on configuration
 */
export function getModel(task: "fast" | "smart" = "fast") {
  // Use Claude Haiku for fast tasks, Sonnet for complex ones
  const modelId = task === "fast" ? "claude-3-5-haiku-latest" : "claude-sonnet-4-20250514"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return anthropic(modelId) as any
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
function parseAIResponse<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    return JSON.parse(cleaned) as T
  } catch (error) {
    logger.error("Failed to parse AI response", { error, text: text.slice(0, 200) })
    return fallback
  }
}

/**
 * AI Service with all operations
 */
export const aiService = {
  /**
   * Analyze a task and extract metadata
   */
  async analyzeTask(rawText: string): Promise<TaskAnalysis> {
    logger.debug("Analyzing task", { rawText })

    const { text } = await generateText({
      model: getModel("fast"),
      system: `You are an executive assistant for a busy professional managing multiple responsibilities.
Analyze tasks and classify them for optimal scheduling and execution.

RESPOND ONLY WITH VALID JSON:
{
  "rewrittenTitle": "clear, actionable task title",
  "context": "Work" | "Home" | "Money" | "Family" | "Health" | "Admin" | "Other",
  "tags": ["Quick win", "Deep work", "Vendor", "Delegate"],
  "etaMinutes": number (1-240),
  "bestTime": "now" | "morning_meeting_window" | "focus_block" | "evening_wind_down" | "weekend" | "anytime",
  "friction": "low" | "medium" | "high",
  "size": "tiny" | "small" | "medium" | "large",
  "delegateCandidate": boolean,
  "vendorCandidate": boolean,
  "quickWin": boolean
}

Guidelines:
- "Quick win": under 10 minutes, low friction
- "Deep work": requires focus, 30+ minutes
- "Vendor": could hire someone (handyman, cleaner)
- "Delegate": could assign to family/assistant`,
      prompt: `Analyze this task: "${rawText}"`,
    })

    const parsed = parseAIResponse<Partial<TaskAnalysis>>(text, {})

    return {
      rewrittenTitle: String(parsed.rewrittenTitle || rawText),
      context: parsed.context || "Other",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      etaMinutes: Math.min(240, Math.max(1, Number(parsed.etaMinutes) || 15)),
      bestTime: parsed.bestTime || "anytime",
      friction: parsed.friction || "medium",
      size: parsed.size || "small",
      delegateCandidate: Boolean(parsed.delegateCandidate),
      vendorCandidate: Boolean(parsed.vendorCandidate),
      quickWin: Boolean(parsed.quickWin),
    }
  },

  /**
   * Break down a task into micro-steps for ADHD-friendly execution
   */
  async breakdownTask(
    title: string,
    description?: string,
    userEnergy: EnergyLevel = "medium"
  ): Promise<TaskBreakdown> {
    logger.debug("Breaking down task", { title, userEnergy })

    const { text } = await generateText({
      model: getModel("smart"),
      system: `You are an executive function coach specializing in ADHD support.
Break tasks into the SMALLEST possible physical actions to eliminate decision paralysis.

CRITICAL RULES:
1. First step MUST be under 2 minutes and require ZERO decisions
2. "starterPhrase" = exact PHYSICAL action (verb + object)
3. "completionCue" = how they know this step is done
4. Never use vague verbs: research, figure out, handle, work on
5. Each step should feel almost trivially easy

RESPOND ONLY WITH VALID JSON array:
[{
  "title": "micro-task name",
  "estimatedMinutes": 1-15,
  "energyLevel": "low" | "medium" | "peak",
  "starterPhrase": "Pick up your phone...",
  "completionCue": "The screen shows..."
}]

Good starterPhrases:
- "Pick up your phone and open..."
- "Put your hand on the mouse and click..."
- "Stand up and walk to..."
- "Say out loud: Hey Siri..."`,
      prompt: `Break this into 3-5 micro-steps for someone with ADHD (current energy: ${userEnergy}):

TASK: "${title}"
${description ? `CONTEXT: "${description}"` : ""}`,
    })

    const defaultSteps: MicroStep[] = [
      {
        title: `Start: ${title}`,
        estimatedMinutes: 2,
        energyLevel: "low",
        starterPhrase: "Open the app or tool you need",
        completionCue: "The app is open on your screen",
      },
    ]

    const steps = parseAIResponse<MicroStep[]>(text, defaultSteps).map((step, i) => ({
      title: step.title || `Step ${i + 1}`,
      estimatedMinutes: Math.min(15, Math.max(1, step.estimatedMinutes || 5)),
      energyLevel: step.energyLevel || "medium",
      starterPhrase: step.starterPhrase || "Begin this step",
      completionCue: step.completionCue || "Move to next step when ready",
    }))

    return {
      steps,
      totalMinutes: steps.reduce((sum, s) => sum + s.estimatedMinutes, 0),
    }
  },

  /**
   * Parse natural language for reminder details
   */
  async parseReminder(text: string): Promise<ReminderParsed> {
    logger.debug("Parsing reminder", { text })

    const { text: result } = await generateText({
      model: getModel("fast"),
      prompt: `Extract reminder details from this natural language input.
Return ONLY valid JSON:
{
  "task": "the action (capitalize properly, remove 'remind me to' prefixes)",
  "date": "specific date or relative like 'tomorrow', 'Monday', or null",
  "time": "specific time in 12hr format like '2:00 PM' or null",
  "relative": "relative duration like 'in 2 hours' or null"
}

Input: "${text}"`,
    })

    return parseAIResponse<ReminderParsed>(result, {
      task: text,
      date: null,
      time: null,
      relative: null,
    })
  },

  /**
   * Prioritize tasks based on user context
   */
  async prioritizeTasks(
    tasks: Array<{ id: string; title: string; context?: string; eta?: number }>,
    userContext: UserContext
  ): Promise<PrioritizationResult> {
    if (!isFeatureEnabled("ENABLE_AI_INSIGHTS")) {
      return {
        prioritizedTasks: tasks.map((t, i) => ({
          taskId: t.id,
          score: 100 - i * 10,
          reasoning: "AI insights disabled",
          suggestedOrder: i + 1,
          urgency: "medium" as const,
          impact: "medium" as const,
        })),
        focusTask: tasks[0]?.id || "",
        quickWins: [],
        canDefer: [],
      }
    }

    logger.debug("Prioritizing tasks", { taskCount: tasks.length, userContext })

    const { text } = await generateText({
      model: getModel("smart"),
      system: `You are a productivity coach helping someone prioritize their tasks.
Consider their current energy, available time, and recent completions.

RESPOND ONLY WITH VALID JSON:
{
  "prioritizedTasks": [{
    "taskId": "id",
    "score": 0-100,
    "reasoning": "brief explanation",
    "suggestedOrder": 1-N,
    "urgency": "critical" | "high" | "medium" | "low",
    "impact": "high" | "medium" | "low"
  }],
  "focusTask": "id of the ONE task to focus on now",
  "quickWins": ["ids of tasks under 10 min"],
  "canDefer": ["ids of tasks that can wait"]
}`,
      prompt: `Prioritize these tasks:
${JSON.stringify(tasks, null, 2)}

User Context:
- Current energy: ${userContext.currentEnergy}
- Time of day: ${userContext.timeOfDay}
- Available minutes: ${userContext.availableMinutes}
- Recently completed: ${userContext.recentCompletions.join(", ") || "none"}
${userContext.currentMood ? `- Current mood: ${userContext.currentMood}` : ""}`,
    })

    const defaultResult: PrioritizationResult = {
      prioritizedTasks: [],
      focusTask: tasks[0]?.id || "",
      quickWins: [],
      canDefer: [],
    }

    return parseAIResponse<PrioritizationResult>(text, defaultResult)
  },

  /**
   * Generate end-of-day review
   */
  async generateDailyReview(
    completedTasks: string[],
    incompleteTasks: string[],
    notes?: string
  ): Promise<DailyReview> {
    logger.debug("Generating daily review", {
      completedCount: completedTasks.length,
      incompleteCount: incompleteTasks.length,
    })

    const { text } = await generateText({
      model: getModel("smart"),
      system: `You are a supportive productivity coach reviewing someone's day.
Be encouraging but honest. Focus on progress, not perfection.

RESPOND ONLY WITH VALID JSON:
{
  "summary": "1-2 sentence overview of the day",
  "completedCount": number,
  "topAccomplishment": "most impactful completed task",
  "blockers": ["what got in the way"],
  "suggestedFocus": ["2-3 areas for improvement"],
  "energyPattern": "observation about their energy/productivity pattern",
  "tomorrowPriorities": ["top 3 tasks for tomorrow"]
}`,
      prompt: `Review this day:

Completed: ${completedTasks.join(", ") || "None"}
Still pending: ${incompleteTasks.join(", ") || "None"}
${notes ? `Notes: ${notes}` : ""}`,
    })

    return parseAIResponse<DailyReview>(text, {
      summary: "Day reviewed.",
      completedCount: completedTasks.length,
      topAccomplishment: completedTasks[0] || "Showing up",
      blockers: [],
      suggestedFocus: [],
      energyPattern: "Keep tracking to identify patterns",
      tomorrowPriorities: incompleteTasks.slice(0, 3),
    })
  },

  /**
   * Learn patterns from user behavior
   */
  async analyzePatterns(
    taskHistory: Array<{
      title: string
      completedAt?: string
      context?: string
      energyWhenDone?: EnergyLevel
    }>
  ): Promise<PatternInsight[]> {
    if (!isFeatureEnabled("ENABLE_AI_INSIGHTS") || taskHistory.length < 5) {
      return []
    }

    logger.debug("Analyzing patterns", { historyLength: taskHistory.length })

    const { text } = await generateText({
      model: getModel("smart"),
      system: `Analyze task completion patterns to provide actionable insights.
Look for: time-of-day patterns, context patterns, energy patterns, task types.

RESPOND ONLY WITH VALID JSON array:
[{
  "pattern": "observation about their behavior",
  "confidence": 0.0-1.0,
  "recommendation": "specific actionable suggestion",
  "basedOn": "what data this is based on"
}]

Limit to 3-5 most useful insights.`,
      prompt: `Analyze these completed tasks for patterns:
${JSON.stringify(taskHistory.slice(-50), null, 2)}`,
    })

    return parseAIResponse<PatternInsight[]>(text, [])
  },
}
