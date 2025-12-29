/**
 * Goals Module Types
 *
 * Types for OKR-style goals with progress tracking.
 */

export type GoalTimeframe = "weekly" | "monthly" | "quarterly" | "yearly"

export type GoalStatus = "active" | "completed" | "abandoned" | "on_hold"

export type KeyResultType = "number" | "percentage" | "currency" | "boolean"

export interface KeyResult {
  id: string
  goal_id: string
  title: string
  description?: string
  type: KeyResultType
  target_value: number
  current_value: number
  unit?: string // e.g., "users", "dollars", "%"
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  icon?: string
  color?: string
  timeframe: GoalTimeframe
  start_date: string
  end_date: string
  status: GoalStatus
  project_id?: string // Optional link to project
  created_at: string
  updated_at: string
}

export interface GoalWithProgress extends Goal {
  keyResults: KeyResult[]
  progress: number // 0-100, calculated from key results
  daysRemaining: number
  isOverdue: boolean
}

export interface CreateGoalInput {
  title: string
  description?: string
  icon?: string
  color?: string
  timeframe: GoalTimeframe
  start_date?: string
  end_date?: string
  project_id?: string
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  icon?: string
  color?: string
  timeframe?: GoalTimeframe
  start_date?: string
  end_date?: string
  status?: GoalStatus
  project_id?: string
}

export interface CreateKeyResultInput {
  goal_id: string
  title: string
  description?: string
  type: KeyResultType
  target_value: number
  current_value?: number
  unit?: string
}

export interface UpdateKeyResultInput {
  title?: string
  description?: string
  type?: KeyResultType
  target_value?: number
  current_value?: number
  unit?: string
}

export interface GoalCheckIn {
  id: string
  goal_id: string
  user_id: string
  key_result_id?: string
  previous_value: number
  new_value: number
  notes?: string
  created_at: string
}
