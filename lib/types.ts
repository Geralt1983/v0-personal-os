export type BestTimeBucket =
  | "now"
  | "morning_meeting_window"
  | "focus_block"
  | "evening_wind_down"
  | "weekend"
  | "anytime"

export type EnergyLevel = "peak" | "medium" | "low"
export type Priority = "high" | "medium" | "low"

export interface Task {
  id: string
  title: string
  description?: string
  originalText?: string
  energyLevel: EnergyLevel
  priority: Priority
  deadline?: Date
  estimatedMinutes: number
  surveillance: boolean
  daysOverdue?: number
  context?: string
  eta?: string
  etaMinutes?: number
  friction?: "low" | "medium" | "high"
  bestTime?: BestTimeBucket
  status: "pending" | "done" | "delegated" | "deleted"
  quickWin?: boolean
  delegateCandidate?: boolean
  vendorCandidate?: boolean
  expiresAt?: Date
  aiRecommendation?: string
  aiTags?: string[]
  patternMatch?: string
  microMoves?: string[]
  isHireOutCandidate?: boolean
}

export interface Reasoning {
  energyMatch: number
  priorityReason: string
  contextNote: string
}

export interface UserStats {
  currentStreak: number
  trustScore: number
  weeklyCompletionRate: number
  energyAccuracy: number
  avgCompletionTime: number
}

export interface SubTask {
  id: string
  title: string
  estimatedMinutes: number
  completed: boolean
}

export interface Suggestion {
  id: string
  text: string
  actionLabel: string
}

export interface TaskAnalysis {
  rewrittenTitle: string
  context: string
  tags: string[]
  friction: "low" | "medium" | "high"
  bestTime: BestTimeBucket
  etaMinutes: number
  quickWin: boolean
  vendorCandidate: boolean
  delegateCandidate: boolean
}

export function calculateTaskScore(task: Task): number {
  let score = 0

  // Urgency from deadline
  if (task.deadline) {
    const now = new Date()
    const deadline = new Date(task.deadline)
    const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) score += 1000
    else if (diffDays === 0) score += 800
    else if (diffDays <= 3) score += 500
  }

  // Days overdue
  if (task.daysOverdue && task.daysOverdue > 0) {
    score += 1000 + task.daysOverdue * 50
  }

  // Priority weight
  if (task.priority === "high") score += 200
  else if (task.priority === "medium") score += 100

  // Surveillance items get boost
  if (task.surveillance) score += 150

  // Quick wins
  if (task.quickWin) score += 70

  // Low friction
  if (task.friction === "low") score += 40
  else if (task.friction === "medium") score += 20

  // Short ETA
  if (task.estimatedMinutes <= 5) score += 25
  else if (task.estimatedMinutes <= 15) score += 10

  return score
}

export function rankTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === "pending")
    .map((t) => ({ task: t, score: calculateTaskScore(t) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task)
}

export function generateRecommendation(task: Task): { action: string; reason: string } | null {
  // Pattern says user delays this category
  if (task.daysOverdue && task.daysOverdue > 0) {
    if (task.vendorCandidate) {
      return { action: "hire", reason: "Overdue. Hire it out." }
    }
    if (task.delegateCandidate) {
      return { action: "delegate", reason: "Overdue. Hand it off." }
    }
    return { action: "do", reason: "Overdue. Do it now." }
  }

  // Quick win with low ETA = do it now
  if (task.quickWin && task.estimatedMinutes && task.estimatedMinutes <= 5) {
    return { action: "do", reason: `${task.estimatedMinutes} min task. Do it now.` }
  }

  // High friction + vendor candidate = hire
  if (task.friction === "high" && task.vendorCandidate) {
    return { action: "hire", reason: "High friction. Probably worth hiring out." }
  }

  // Medium/high friction + delegate candidate
  if ((task.friction === "medium" || task.friction === "high") && task.delegateCandidate) {
    return { action: "delegate", reason: "This can be handed off." }
  }

  // Low friction, short ETA = just do it
  if (task.estimatedMinutes && task.estimatedMinutes <= 10 && task.friction === "low") {
    return { action: "do", reason: `${task.estimatedMinutes} min, low friction. Just do it.` }
  }

  // Best time is now
  if (task.bestTime === "now" && task.friction !== "high") {
    return { action: "do", reason: "Best time is now. Get it done." }
  }

  return null
}
