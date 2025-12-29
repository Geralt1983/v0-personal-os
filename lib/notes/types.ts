/**
 * Notes Module Types
 *
 * Types for quick capture notes with task linking.
 */

export type NoteType = "quick" | "task" | "idea" | "reference" | "meeting"

export interface Note {
  id: string
  user_id: string
  title?: string
  content: string
  type: NoteType
  task_id?: string // Link to a task
  project_id?: string // Link to a project
  goal_id?: string // Link to a goal
  tags: string[]
  pinned: boolean
  archived: boolean
  created_at: string
  updated_at: string
}

export interface NoteWithLinks extends Note {
  linkedTask?: {
    id: string
    title: string
    completed: boolean
  }
  linkedProject?: {
    id: string
    title: string
    status: string
  }
  linkedGoal?: {
    id: string
    title: string
    progress: number
  }
}

export interface CreateNoteInput {
  title?: string
  content: string
  type?: NoteType
  task_id?: string
  project_id?: string
  goal_id?: string
  tags?: string[]
  pinned?: boolean
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  type?: NoteType
  task_id?: string | null
  project_id?: string | null
  goal_id?: string | null
  tags?: string[]
  pinned?: boolean
  archived?: boolean
}

export interface NoteSearchResult {
  notes: NoteWithLinks[]
  total: number
}
