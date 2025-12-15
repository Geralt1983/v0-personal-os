import type { Task, Reasoning, UserStats, SubTask } from "./types"

export const currentTask: Task = {
  id: "1",
  title: "Review Orlando client documentation",
  energyLevel: "medium",
  priority: "high",
  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  estimatedMinutes: 25,
  surveillance: false,
  status: "pending",
  friction: "medium",
  bestTime: "focus_block",
}

export const reasoning: Reasoning = {
  energyMatch: 95,
  priorityReason: "Deadline in 2 days. Ashley has been notified.",
  contextNote: "You complete documentation tasks 40% faster during morning hours (8-11 AM).",
}

export const stats: UserStats = {
  currentStreak: 12,
  trustScore: 87,
  weeklyCompletionRate: 80,
  energyAccuracy: 92,
  avgCompletionTime: 18,
}

export const surveillanceTasks: Task[] = [
  {
    id: "2",
    title: "Submit Memphis invoice",
    energyLevel: "low",
    priority: "high",
    surveillance: true,
    daysOverdue: 2,
    estimatedMinutes: 15,
    status: "pending",
    friction: "low",
  },
  {
    id: "3",
    title: "Schedule contractor call",
    energyLevel: "low",
    priority: "medium",
    surveillance: true,
    daysOverdue: 1,
    estimatedMinutes: 10,
    status: "pending",
    friction: "low",
  },
  {
    id: "4",
    title: "Prep Thursday financial docs",
    energyLevel: "medium",
    priority: "high",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    surveillance: true,
    estimatedMinutes: 45,
    status: "pending",
    friction: "medium",
  },
]

export const allTasks: Task[] = [currentTask, ...surveillanceTasks]

export const breakdownSubtasks: SubTask[] = [
  { id: "s1", title: "Gather Q4 data from dashboard", estimatedMinutes: 15, completed: false },
  { id: "s2", title: "Draft outline in doc", estimatedMinutes: 20, completed: false },
  { id: "s3", title: "Write intro section", estimatedMinutes: 30, completed: false },
]

export const cantDoOptions = [
  { id: "1", label: "Too overwhelming/big" },
  { id: "2", label: "Wrong energy level right now" },
  { id: "3", label: "Missing information I need" },
  { id: "4", label: "Not actually urgent" },
]
