/**
 * Habits Module Types
 *
 * Types for habit tracking, streaks, and reminders.
 */

export type HabitFrequency = "daily" | "weekly" | "custom"

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sunday = 0

export interface HabitFrequencyConfig {
  type: HabitFrequency
  days?: DayOfWeek[] // For weekly/custom - which days
  timesPerPeriod?: number // e.g., 3 times per week
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description?: string
  icon?: string
  color?: string
  frequency: HabitFrequencyConfig
  reminder_time?: string // HH:MM format
  streak_current: number
  streak_best: number
  total_completions: number
  created_at: string
  updated_at: string
  archived: boolean
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
}

export interface HabitStats {
  habit_id: string
  current_streak: number
  best_streak: number
  total_completions: number
  completion_rate: number // 0-100
  last_completed_at?: string
}

export interface HabitWithStats extends Habit {
  completedToday: boolean
  completionsThisWeek: number
  isOnTrack: boolean
}

export interface CreateHabitInput {
  title: string
  description?: string
  icon?: string
  color?: string
  frequency: HabitFrequencyConfig
  reminder_time?: string
}

export interface UpdateHabitInput {
  title?: string
  description?: string
  icon?: string
  color?: string
  frequency?: HabitFrequencyConfig
  reminder_time?: string
  archived?: boolean
}
