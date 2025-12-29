/**
 * Proactive Suggestions Engine
 *
 * Generates contextual suggestions based on user behavior, time, and task patterns.
 * Designed to reduce decision fatigue and improve task completion rates.
 */

import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createLogger } from "@/lib/logger"
import { isFeatureEnabled } from "@/lib/feature-flags"
import type { EnergyLevel, TaskContext } from "./types"

const logger = createLogger("Suggestions")

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type SuggestionType =
  | "next_task"
  | "break_reminder"
  | "energy_match"
  | "quick_win"
  | "blocked_help"
  | "pattern_insight"
  | "time_sensitive"
  | "delegation"

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  actionLabel: string
  taskId?: string
  priority: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface UserState {
  currentEnergy: EnergyLevel
  lastTaskCompletedAt?: Date
  tasksCompletedToday: number
  currentStreak: number
  blockedTaskIds: string[]
  focusingSince?: Date
}

export interface TaskData {
  id: string
  title: string
  context: TaskContext
  etaMinutes: number
  dueDate?: Date
  isQuickWin: boolean
  friction: "low" | "medium" | "high"
  skippedCount: number
}

/**
 * Generate contextual suggestions based on current state
 */
export async function generateSuggestions(
  tasks: TaskData[],
  userState: UserState,
  limit: number = 3
): Promise<Suggestion[]> {
  if (!isFeatureEnabled("ENABLE_AI_INSIGHTS")) {
    return getBasicSuggestions(tasks, userState, limit)
  }

  logger.debug("Generating suggestions", {
    taskCount: tasks.length,
    energy: userState.currentEnergy,
  })

  const suggestions: Suggestion[] = []
  const now = new Date()
  const hour = now.getHours()

  // 1. Check for break reminder (after sustained focus)
  if (userState.focusingSince) {
    const focusMinutes = (now.getTime() - userState.focusingSince.getTime()) / 60000
    if (focusMinutes > 45) {
      suggestions.push({
        id: `break-${Date.now()}`,
        type: "break_reminder",
        title: "Time for a break",
        description: `You've been focused for ${Math.round(focusMinutes)} minutes. A short break will boost your productivity.`,
        actionLabel: "Take 5 min break",
        priority: 90,
        expiresAt: new Date(now.getTime() + 15 * 60000),
      })
    }
  }

  // 2. Suggest quick wins when energy is low
  if (userState.currentEnergy === "low") {
    const quickWins = tasks.filter((t) => t.isQuickWin && t.friction === "low").slice(0, 2)
    for (const task of quickWins) {
      suggestions.push({
        id: `quickwin-${task.id}`,
        type: "quick_win",
        title: "Quick win available",
        description: `"${task.title}" takes about ${task.etaMinutes} min. Small wins build momentum.`,
        actionLabel: "Start this task",
        taskId: task.id,
        priority: 80,
      })
    }
  }

  // 3. Energy-matched task suggestions
  const energyMatchedTasks = getEnergyMatchedTasks(tasks, userState.currentEnergy)
  const bestMatch = energyMatchedTasks[0]
  if (bestMatch && suggestions.length < limit) {
    suggestions.push({
      id: `energy-${bestMatch.id}`,
      type: "energy_match",
      title: "Good fit for your energy",
      description: `"${bestMatch.title}" matches your current ${userState.currentEnergy} energy level.`,
      actionLabel: "Work on this",
      taskId: bestMatch.id,
      priority: 75,
    })
  }

  // 4. Time-sensitive tasks
  const timeSensitive = tasks.filter((t) => {
    if (!t.dueDate) return false
    const hoursUntilDue = (t.dueDate.getTime() - now.getTime()) / 3600000
    return hoursUntilDue > 0 && hoursUntilDue < 24
  })

  for (const task of timeSensitive.slice(0, 1)) {
    suggestions.push({
      id: `urgent-${task.id}`,
      type: "time_sensitive",
      title: "Due soon",
      description: `"${task.title}" is due within 24 hours.`,
      actionLabel: "Prioritize this",
      taskId: task.id,
      priority: 95,
    })
  }

  // 5. Help with blocked tasks
  const blockedTasks = tasks.filter((t) => userState.blockedTaskIds.includes(t.id))
  const firstBlocked = blockedTasks[0]
  if (firstBlocked) {
    suggestions.push({
      id: `blocked-${firstBlocked.id}`,
      type: "blocked_help",
      title: "Need help with a stuck task?",
      description: `"${firstBlocked.title}" seems blocked. Want me to break it down?`,
      actionLabel: "Break it down",
      taskId: firstBlocked.id,
      priority: 70,
    })
  }

  // 6. Delegation suggestions for high-friction tasks
  const delegateable = tasks.filter((t) => t.friction === "high" && t.etaMinutes > 30)
  const firstDelegateable = delegateable[0]
  if (firstDelegateable && suggestions.length < limit) {
    suggestions.push({
      id: `delegate-${firstDelegateable.id}`,
      type: "delegation",
      title: "Consider delegating",
      description: `"${firstDelegateable.title}" is high-friction. Could someone else handle this?`,
      actionLabel: "Explore options",
      taskId: firstDelegateable.id,
      priority: 50,
    })
  }

  // 7. Pattern insights (using AI)
  if (suggestions.length < limit && tasks.length > 3) {
    try {
      const insight = await generatePatternInsight(tasks, userState, hour)
      if (insight) {
        suggestions.push(insight)
      }
    } catch (error) {
      logger.error("Failed to generate pattern insight", { error })
    }
  }

  // Sort by priority and limit
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, limit)
}

/**
 * Get tasks that match current energy level
 */
function getEnergyMatchedTasks(tasks: TaskData[], energy: EnergyLevel): TaskData[] {
  const energyMap: Record<EnergyLevel, { maxEta: number; friction: string[] }> = {
    low: { maxEta: 15, friction: ["low"] },
    medium: { maxEta: 45, friction: ["low", "medium"] },
    peak: { maxEta: 120, friction: ["low", "medium", "high"] },
  }

  const config = energyMap[energy]

  return tasks
    .filter((t) => t.etaMinutes <= config.maxEta && config.friction.includes(t.friction))
    .sort((a, b) => {
      // Prioritize lower friction at lower energy
      if (energy === "low") {
        return a.etaMinutes - b.etaMinutes
      }
      // Prioritize impact at peak energy
      return b.etaMinutes - a.etaMinutes
    })
}

/**
 * Generate AI-powered pattern insight
 */
async function generatePatternInsight(
  tasks: TaskData[],
  userState: UserState,
  hour: number
): Promise<Suggestion | null> {
  const { text } = await generateText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: anthropic("claude-3-5-haiku-latest") as any,
    system: `You are a productivity coach. Generate ONE brief, actionable insight.
Respond with JSON only: {"title": "short title", "description": "1 sentence", "actionLabel": "2-3 words"}`,
    prompt: `Current state:
- Time: ${hour}:00
- Energy: ${userState.currentEnergy}
- Completed today: ${userState.tasksCompletedToday}
- Pending tasks: ${tasks.length}
- Task types: ${[...new Set(tasks.map((t) => t.context))].join(", ")}

Generate a brief productivity insight.`,
  })

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return {
      id: `insight-${Date.now()}`,
      type: "pattern_insight",
      title: parsed.title || "Insight",
      description: parsed.description || "Keep up the good work!",
      actionLabel: parsed.actionLabel || "Got it",
      priority: 40,
    }
  } catch {
    return null
  }
}

/**
 * Basic suggestions without AI
 */
function getBasicSuggestions(
  tasks: TaskData[],
  _userState: UserState,
  limit: number
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const first = tasks[0]

  // Suggest first incomplete task
  if (first) {
    suggestions.push({
      id: `next-${first.id}`,
      type: "next_task",
      title: "Next up",
      description: `"${first.title}" - ${first.etaMinutes} min`,
      actionLabel: "Start",
      taskId: first.id,
      priority: 80,
    })
  }

  // Quick win if available
  const quickWin = tasks.find((t) => t.isQuickWin)
  if (quickWin && quickWin.id !== first?.id) {
    suggestions.push({
      id: `quick-${quickWin.id}`,
      type: "quick_win",
      title: "Quick win",
      description: `"${quickWin.title}" - ${quickWin.etaMinutes} min`,
      actionLabel: "Do it now",
      taskId: quickWin.id,
      priority: 70,
    })
  }

  return suggestions.slice(0, limit)
}

type ContextType = "morning" | "afternoon" | "evening" | "stuck" | "completing"

/**
 * Get suggestion for a specific context
 */
export function getSuggestionForContext(
  context: ContextType,
  tasksCompleted: number = 0
): Suggestion {
  const contextSuggestions: Record<ContextType, Suggestion> = {
    morning: {
      id: "morning-routine",
      type: "pattern_insight",
      title: "Good morning!",
      description: "Start with your most important task while your energy is fresh.",
      actionLabel: "Plan my day",
      priority: 85,
    },
    afternoon: {
      id: "afternoon-slump",
      type: "energy_match",
      title: "Afternoon focus",
      description: "Try a quick task to maintain momentum through the afternoon.",
      actionLabel: "Find quick wins",
      priority: 70,
    },
    evening: {
      id: "evening-wind-down",
      type: "pattern_insight",
      title: "Wrapping up",
      description: "Plan tomorrow's top 3 tasks before you finish today.",
      actionLabel: "Plan tomorrow",
      priority: 75,
    },
    stuck: {
      id: "stuck-help",
      type: "blocked_help",
      title: "Feeling stuck?",
      description: "Let's break down your current task into smaller steps.",
      actionLabel: "Break it down",
      priority: 90,
    },
    completing: {
      id: "completion-streak",
      type: "pattern_insight",
      title: `${tasksCompleted} tasks done!`,
      description: "Great momentum! Keep it going with another quick win.",
      actionLabel: "Continue streak",
      priority: 80,
    },
  }

  return contextSuggestions[context] ?? contextSuggestions.morning
}
