import type { Task } from "@/hooks/use-tasks"

interface SortContext {
  userEnergyLevel: "peak" | "medium" | "low"
  currentHour?: number
  isWeekend?: boolean
}

const energyToScore: Record<string, number> = {
  peak: 10,
  medium: 6,
  low: 3,
}

const priorityToScore: Record<string, number> = {
  high: 10,
  medium: 6,
  low: 3,
}

export function smartSortTasks(tasks: Task[], context?: Partial<SortContext>): Task[] {
  const now = new Date()
  const ctx: SortContext = {
    userEnergyLevel: context?.userEnergyLevel ?? inferUserEnergy(now.getHours()),
    currentHour: context?.currentHour ?? now.getHours(),
    isWeekend: context?.isWeekend ?? (now.getDay() === 0 || now.getDay() === 6),
  }

  const userEnergy = energyToScore[ctx.userEnergyLevel] || 6

  return [...tasks]
    .filter((t) => !t.completed && !t.skipped)
    .map((task) => {
      const taskEnergy = energyToScore[task.energy_level || "medium"] || 6
      const taskPriority = priorityToScore[task.priority || "medium"] || 6

      // Perfect match (delta=0) = 100, slight mismatch (delta=3) = 49, bad mismatch (delta=7) = 9
      const energyDelta = Math.abs(taskEnergy - userEnergy)
      const energyMatchScore = Math.pow(10 - energyDelta, 2)

      // DEADLINE URGENCY SCORE
      let urgencyScore = 0
      if (task.deadline) {
        const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
        if (hoursUntilDeadline < 0) {
          // Overdue - high urgency
          urgencyScore = 50 + Math.min(50, (Math.abs(hoursUntilDeadline) / 24) * 10)
        } else if (hoursUntilDeadline < 24) {
          urgencyScore = 40
        } else if (hoursUntilDeadline < 72) {
          urgencyScore = 20
        }
      }

      const quickWinBonus = (task.estimated_minutes || 25) <= 10 && ctx.userEnergyLevel !== "peak" ? 15 : 0

      // TIME-OF-DAY ALIGNMENT
      let timeAlignmentScore = 0
      const titleLower = (task.title || "").toLowerCase()
      const currentHour = ctx.currentHour ?? new Date().getHours()

      // Calls/meetings better in morning business hours
      if (titleLower.includes("call") || titleLower.includes("meeting")) {
        if (currentHour >= 9 && currentHour <= 11) {
          timeAlignmentScore = 10
        } else if (currentHour >= 14 && currentHour <= 16) {
          timeAlignmentScore = 5
        }
      }
      // Deep work better in focus hours
      if (task.energy_level === "peak" && currentHour >= 9 && currentHour <= 11) {
        timeAlignmentScore = 10
      }
      // Admin/low-energy tasks better in wind-down
      if (task.energy_level === "low" && currentHour >= 17) {
        timeAlignmentScore = 8
      }

      // Priority base score
      const priorityScore = taskPriority * 5

      const totalScore = energyMatchScore * 3 + urgencyScore * 2 + priorityScore + quickWinBonus + timeAlignmentScore

      return { task, score: totalScore }
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.task)
}

function inferUserEnergy(hour: number): "peak" | "medium" | "low" {
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) return "peak"
  if ((hour >= 8 && hour < 9) || (hour > 11 && hour < 14) || (hour > 16 && hour <= 18)) return "medium"
  return "low"
}

export function calculateEnergyMatch(taskEnergy: string, userEnergy: "peak" | "medium" | "low"): number {
  const taskScore = energyToScore[taskEnergy] || 6
  const userScore = energyToScore[userEnergy] || 6
  const delta = Math.abs(taskScore - userScore)
  // Returns 0-100 percentage
  return Math.round(Math.pow(10 - delta, 2))
}

export function getTaskSortingReason(task: Task, userEnergy?: "peak" | "medium" | "low"): string {
  const reasons: string[] = []
  const energy = userEnergy ?? inferUserEnergy(new Date().getHours())

  // Check deadline
  if (task.deadline) {
    const hoursUntil = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 0) reasons.push("overdue")
    else if (hoursUntil < 24) reasons.push("due today")
    else if (hoursUntil < 72) reasons.push("due soon")
  }

  // Check energy match
  const match = calculateEnergyMatch(task.energy_level || "medium", energy)
  if (match >= 80) reasons.push("energy match")
  else if (match <= 30) reasons.push("energy mismatch")

  // Check quick win
  if ((task.estimated_minutes || 25) <= 10) reasons.push("quick win")

  // Check priority
  if (task.priority === "high") reasons.push("high priority")

  return reasons.length > 0 ? reasons.slice(0, 2).join(" • ") : "Next in queue"
}
