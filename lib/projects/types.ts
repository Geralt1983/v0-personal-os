/**
 * Projects Module Types
 *
 * Types for project management with multi-task grouping and milestones.
 */

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived"

export type MilestoneStatus = "pending" | "in_progress" | "completed"

export interface Milestone {
  id: string
  project_id: string
  title: string
  description?: string
  due_date?: string
  status: MilestoneStatus
  position: number
  created_at: string
  completed_at?: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  icon?: string
  color?: string
  status: ProjectStatus
  due_date?: string
  created_at: string
  updated_at: string
}

export interface ProjectWithStats extends Project {
  taskCount: number
  completedTaskCount: number
  milestones: Milestone[]
  progress: number // 0-100
}

export interface CreateProjectInput {
  title: string
  description?: string
  icon?: string
  color?: string
  due_date?: string
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  icon?: string
  color?: string
  status?: ProjectStatus
  due_date?: string
}

export interface CreateMilestoneInput {
  project_id: string
  title: string
  description?: string
  due_date?: string
}

export interface UpdateMilestoneInput {
  title?: string
  description?: string
  due_date?: string
  status?: MilestoneStatus
  position?: number
}

export interface ProjectTask {
  id: string
  project_id: string
  task_id: string
  milestone_id?: string
  position: number
  created_at: string
}
