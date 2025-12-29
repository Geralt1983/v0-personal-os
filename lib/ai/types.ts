/**
 * AI Service Type Definitions
 */

export type TaskContext = "Work" | "Home" | "Money" | "Family" | "Health" | "Admin" | "Other"
export type EnergyLevel = "low" | "medium" | "peak"
export type FrictionLevel = "low" | "medium" | "high"
export type TaskSize = "tiny" | "small" | "medium" | "large"
export type BestTime =
  | "now"
  | "morning_meeting_window"
  | "focus_block"
  | "evening_wind_down"
  | "weekend"
  | "anytime"

export interface TaskAnalysis {
  rewrittenTitle: string
  context: TaskContext
  tags: string[]
  etaMinutes: number
  bestTime: BestTime
  friction: FrictionLevel
  size: TaskSize
  delegateCandidate: boolean
  vendorCandidate: boolean
  quickWin: boolean
}

export interface MicroStep {
  title: string
  estimatedMinutes: number
  energyLevel: EnergyLevel
  starterPhrase: string
  completionCue: string
}

export interface TaskBreakdown {
  steps: MicroStep[]
  totalMinutes: number
}

export interface ReminderParsed {
  task: string
  date: string | null
  time: string | null
  relative: string | null
}

export interface DailyReview {
  summary: string
  completedCount: number
  topAccomplishment: string
  blockers: string[]
  suggestedFocus: string[]
  energyPattern: string
  tomorrowPriorities: string[]
}

export interface TaskPrioritization {
  taskId: string
  score: number
  reasoning: string
  suggestedOrder: number
  urgency: "critical" | "high" | "medium" | "low"
  impact: "high" | "medium" | "low"
}

export interface PrioritizationResult {
  prioritizedTasks: TaskPrioritization[]
  focusTask: string
  quickWins: string[]
  canDefer: string[]
}

export interface UserContext {
  currentEnergy: EnergyLevel
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  availableMinutes: number
  recentCompletions: string[]
  currentMood?: string
}

export interface PatternInsight {
  pattern: string
  confidence: number
  recommendation: string
  basedOn: string
}
