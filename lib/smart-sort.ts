import type { Task } from "@/hooks/use-tasks"

interface ScoringContext {
  currentHour: number
  dayOfWeek: number
  userEnergyLevel?: "peak" | "medium" | "low"
}

interface ScoredTask {
  task: Task
  score: number
  reasons: string[]
}

export function smartSortTasks(tasks: Task[], context?: Partial<ScoringContext>): Task[] {
  const now = new Date()
  const ctx: ScoringContext = {
    currentHour: context?.currentHour ?? now.getHours(),
    dayOfWeek: context?.dayOfWeek ?? now.getDay(),
    userEnergyLevel: context?.userEnergyLevel ?? inferUserEnergy(now.getHours()),
  }

  const scored = tasks
    .filter((t) => !t.completed && !t.skipped)
    .map((task) => scoreTask(task, ctx))
    .sort((a, b) => b.score - a.score)

  return scored.map((s) => s.task)
}

function inferUserEnergy(hour: number): "peak" | "medium" | "low" {
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) return "peak"
  if ((hour >= 8 && hour < 9) || (hour > 11 && hour < 14) || (hour > 16 && hour <= 18)) return "medium"
  return "low"
}

function scoreTask(task: Task, ctx: ScoringContext): ScoredTask {
  let score = 0
  const reasons: string[] = []

  // 1. Deadline urgency
  if (task.deadline) {
    const hoursUntil = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 0) {
      score += 500 + Math.min(Math.abs(hoursUntil) * 10, 200)
      reasons.push("overdue")
    } else if (hoursUntil < 4) {
      score += 400
      reasons.push("due very soon")
    } else if (hoursUntil < 24) {
      score += 300
      reasons.push("due today")
    } else if (hoursUntil < 72) {
      score += 150
      reasons.push("due soon")
    }
  }

  // 2. Energy matching
  const taskEnergy = task.energy_level || "medium"
  if (taskEnergy === ctx.userEnergyLevel) {
    score += 100
    reasons.push("energy match")
  } else if (
    (ctx.userEnergyLevel === "peak" && taskEnergy === "medium") ||
    (ctx.userEnergyLevel === "medium" && taskEnergy === "low")
  ) {
    score += 50
  } else if (ctx.userEnergyLevel === "low" && taskEnergy === "peak") {
    score -= 50
    reasons.push("energy mismatch")
  }

  // 3. Quick wins
  const isQuickWin = (task.estimated_minutes || 25) <= 10
  if (isQuickWin) {
    score += 75
    reasons.push("quick win")
    if (ctx.userEnergyLevel === "low") {
      score += 50
    }
  }

  // 4. Priority weight
  if (task.priority === "high") {
    score += 80
    reasons.push("high priority")
  } else if (task.priority === "medium") {
    score += 40
  }

  // 5. Task age
  const ageInDays = (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
  const agePenalty = Math.min(ageInDays * 5, 70)
  score += agePenalty
  if (ageInDays > 7) {
    reasons.push("aging task")
  }

  // 6. Time-of-day matching
  const titleLower = task.title.toLowerCase()
  const isCall = titleLower.includes("call") || titleLower.includes("phone")
  const isEmail = titleLower.includes("email") || titleLower.includes("respond")
  const isWeekend = ctx.dayOfWeek === 0 || ctx.dayOfWeek === 6

  if (isCall && ctx.currentHour >= 9 && ctx.currentHour <= 17 && !isWeekend) {
    score += 60
    reasons.push("good time for calls")
  }
  if (isEmail && ctx.currentHour >= 8 && ctx.currentHour <= 10) {
    score += 40
    reasons.push("morning email window")
  }

  return { task, score, reasons }
}

export function getTaskSortingReason(task: Task, context?: Partial<ScoringContext>): string {
  const now = new Date()
  const ctx: ScoringContext = {
    currentHour: context?.currentHour ?? now.getHours(),
    dayOfWeek: context?.dayOfWeek ?? now.getDay(),
    userEnergyLevel: context?.userEnergyLevel ?? inferUserEnergy(now.getHours()),
  }

  const { reasons } = scoreTask(task, ctx)
  if (reasons.length === 0) return "Next in queue"
  return reasons.slice(0, 2).join(" • ")
}
