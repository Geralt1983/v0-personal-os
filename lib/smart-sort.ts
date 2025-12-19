import type { Task } from "@/hooks/use-tasks"

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

export interface SortContext {
  userEnergyLevel: "peak" | "medium" | "low"
  currentHour?: number
}

export interface ScoredTask extends Task {
  _scores: {
    energyMatch: number
    priority: number
    urgency: number
    quickWin: number
    timeAlignment: number
    total: number
  }
}

export function smartSortTasks(tasks: Task[], context: SortContext): ScoredTask[] {
  const { userEnergyLevel, currentHour = new Date().getHours() } = context
  const userEnergy = energyToScore[userEnergyLevel] || 6

  return [...tasks]
    .map((task): ScoredTask => {
      const taskEnergy = energyToScore[task.energy_level || "medium"] || 6
      const taskPriority = priorityToScore[task.priority || "medium"] || 6

      const energyDelta = Math.abs(taskEnergy - userEnergy)
      const energyMatchScore = Math.pow(10 - energyDelta, 2)

      // Deadline urgency
      let urgencyScore = 0
      if (task.deadline) {
        const hoursUntil = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
        if (hoursUntil < 0) {
          urgencyScore = 50 + Math.min(50, (Math.abs(hoursUntil) / 24) * 10)
        } else if (hoursUntil < 24) {
          urgencyScore = 40
        } else if (hoursUntil < 72) {
          urgencyScore = 20
        }
      }

      // Quick win bonus
      const quickWinBonus = (task.estimated_minutes || 25) <= 10 && userEnergyLevel !== "peak" ? 15 : 0

      // Time alignment
      let timeAlignmentScore = 0
      const titleLower = (task.title || "").toLowerCase()

      if (titleLower.includes("call") || titleLower.includes("meeting")) {
        if (currentHour >= 9 && currentHour <= 11) timeAlignmentScore = 10
        else if (currentHour >= 14 && currentHour <= 16) timeAlignmentScore = 5
      }
      if (task.energy_level === "peak" && currentHour >= 9 && currentHour <= 11) {
        timeAlignmentScore = 10
      }
      if (task.energy_level === "low" && currentHour >= 17) {
        timeAlignmentScore = 8
      }

      // Final score
      const totalScore = energyMatchScore * 3 + taskPriority * 2 + urgencyScore + quickWinBonus + timeAlignmentScore

      return {
        ...task,
        _scores: {
          energyMatch: energyMatchScore,
          priority: taskPriority,
          urgency: urgencyScore,
          quickWin: quickWinBonus,
          timeAlignment: timeAlignmentScore,
          total: totalScore,
        },
      }
    })
    .sort((a, b) => b._scores.total - a._scores.total)
}

export function calculateEnergyMatch(taskEnergy: string | undefined, userEnergy: "peak" | "medium" | "low"): number {
  const taskScore = energyToScore[taskEnergy || "medium"] || 6
  const userScore = energyToScore[userEnergy] || 6
  const delta = Math.abs(taskScore - userScore)

  const maxDelta = 7
  const minMatch = 45
  const maxMatch = 95

  return Math.round(maxMatch - (delta / maxDelta) * (maxMatch - minMatch))
}

export function getTaskSelectionReason(task: ScoredTask): string {
  const scores = task._scores
  if (!scores) return "Next task in your queue."

  const reasons: string[] = []

  if (scores.energyMatch >= 81) reasons.push("Perfect energy match")
  else if (scores.energyMatch >= 49) reasons.push("Good energy fit")

  if (scores.urgency >= 50) reasons.push("Overdue - needs attention")
  else if (scores.urgency >= 40) reasons.push("Due today")

  if (scores.quickWin > 0) reasons.push("Quick win")
  if (scores.timeAlignment >= 10) reasons.push("Ideal time for this")

  return reasons.length > 0 ? reasons.slice(0, 2).join(". ") + "." : "Next in your prioritized queue."
}
