import type { Reasoning } from "./types"

export function generateTaskReasoning(
  task: {
    title: string
    priority?: string
    energy_level?: string
    estimated_minutes?: number
    deadline?: string
    created_at?: string
  },
  isPostReset = false,
  tasksCompletedToday = 0,
): Reasoning {
  const now = new Date()
  const currentHour = now.getHours()
  const dayOfWeek = now.getDay()

  const energyMatch = calculateEnergyMatch(currentHour, task.energy_level)
  const priorityReason = generatePriorityReason(task, isPostReset, tasksCompletedToday)
  const contextNote = generateContextNote(currentHour, dayOfWeek, task, isPostReset)

  return {
    energyMatch,
    priorityReason,
    contextNote,
  }
}

function calculateEnergyMatch(hour: number, taskEnergy?: string): number {
  const isPeakHour = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)
  const isMediumHour = (hour >= 8 && hour < 9) || (hour > 11 && hour < 14) || (hour > 16 && hour <= 18)

  let userEnergyLevel: "peak" | "medium" | "low"
  if (isPeakHour) userEnergyLevel = "peak"
  else if (isMediumHour) userEnergyLevel = "medium"
  else userEnergyLevel = "low"

  const taskEnergyLevel = taskEnergy || "medium"

  if (userEnergyLevel === taskEnergyLevel) return 95
  if (
    (userEnergyLevel === "peak" && taskEnergyLevel === "medium") ||
    (userEnergyLevel === "medium" && taskEnergyLevel === "peak") ||
    (userEnergyLevel === "medium" && taskEnergyLevel === "low") ||
    (userEnergyLevel === "low" && taskEnergyLevel === "medium")
  )
    return 70
  return 45
}

function generatePriorityReason(
  task: {
    priority?: string
    deadline?: string
    estimated_minutes?: number
    title: string
  },
  isPostReset: boolean,
  tasksCompletedToday: number,
): string {
  // Post-reset encouragement
  if (isPostReset) {
    if (tasksCompletedToday === 0) {
      return "You reset recently. This small task is perfect to rebuild momentum."
    }
    if (tasksCompletedToday > 0) {
      return `${tasksCompletedToday} down already. Keep building.`
    }
  }

  const reasons: string[] = []

  if (task.deadline) {
    const deadline = new Date(task.deadline)
    const now = new Date()
    const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    const daysUntil = hoursUntil / 24

    if (hoursUntil < 0) {
      reasons.push(
        `Overdue by ${Math.abs(Math.floor(daysUntil))} day${Math.abs(Math.floor(daysUntil)) !== 1 ? "s" : ""}`,
      )
    } else if (hoursUntil < 24) {
      reasons.push("Due today")
    } else if (daysUntil < 3) {
      reasons.push(`Due in ${Math.ceil(daysUntil)} day${Math.ceil(daysUntil) !== 1 ? "s" : ""}`)
    }
  }

  if (task.priority === "high") {
    reasons.push("marked as high priority")
  }

  if (task.estimated_minutes && task.estimated_minutes <= 10) {
    reasons.push("quick win opportunity")
  }

  const urgentKeywords = ["call", "respond", "reply", "urgent", "asap", "today", "submit", "send"]
  const titleLower = task.title.toLowerCase()
  if (urgentKeywords.some((keyword) => titleLower.includes(keyword))) {
    reasons.push("appears time-sensitive")
  }

  if (reasons.length === 0) {
    return "Next in your prioritized queue based on context and timing."
  }

  const combined = reasons.join(", ")
  return combined.charAt(0).toUpperCase() + combined.slice(1) + "."
}

function generateContextNote(
  hour: number,
  dayOfWeek: number,
  task: { title: string; estimated_minutes?: number; energy_level?: string },
  isPostReset: boolean,
): string {
  // Post-reset context
  if (isPostReset && task.estimated_minutes && task.estimated_minutes <= 10) {
    return "Starting with quick wins helps rebuild confidence and momentum."
  }

  const titleLower = task.title.toLowerCase()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isMorning = hour >= 6 && hour < 12
  const isAfternoon = hour >= 12 && hour < 17
  const isEvening = hour >= 17 && hour < 21

  if (titleLower.includes("call") || titleLower.includes("phone")) {
    if (isMorning && !isWeekend) {
      return "Morning calls tend to have higher connection rates. Good timing."
    }
    if (isAfternoon && !isWeekend) {
      return "Afternoon is typically good for business calls."
    }
    if (isEvening || isWeekend) {
      return "Consider if this call can wait for business hours."
    }
  }

  if (titleLower.includes("email") || titleLower.includes("respond") || titleLower.includes("reply")) {
    if (isMorning) {
      return "Processing emails in the morning clears mental space for deep work."
    }
    return "Batch email tasks to protect focus time."
  }

  if (titleLower.includes("schedule") || titleLower.includes("appointment") || titleLower.includes("book")) {
    return "Administrative tasks are best done in transition periods between focus blocks."
  }

  if (titleLower.includes("submit") || titleLower.includes("send") || titleLower.includes("invoice")) {
    if (isMorning) {
      return "Morning submissions get processed same-day. Good timing."
    }
    return "Quick administrative task—knock it out to clear mental overhead."
  }

  if (task.energy_level === "peak" && hour >= 9 && hour <= 11) {
    return "Your peak energy window aligns well with this task's demands."
  }

  if (task.energy_level === "low" && (isEvening || hour < 9)) {
    return "Low-energy tasks fit well in wind-down or warm-up periods."
  }

  if (task.estimated_minutes && task.estimated_minutes <= 5) {
    return "Two-minute rule: if it's this quick, do it now to clear mental overhead."
  }

  if (task.estimated_minutes && task.estimated_minutes >= 45) {
    if (isMorning && !isWeekend) {
      return "Morning focus blocks are ideal for deep work like this."
    }
    return "Block uninterrupted time for this longer task."
  }

  if (isMorning) {
    return "Morning clarity makes this a good time for task initiation."
  }
  if (isAfternoon) {
    return "Afternoon execution window—momentum from morning carries forward."
  }
  if (isEvening) {
    return "Evening wind-down—consider if this needs tonight or can wait."
  }

  return "Positioned based on your task queue and current context."
}
