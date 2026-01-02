"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type { Task } from "./use-tasks"

// Types
export type EnergyLevel = "high" | "normal" | "low"
export type PlanStatus = "active" | "completed" | "abandoned"
export type PlannedTaskStatus = "pending" | "in_progress" | "completed" | "skipped" | "deferred"

export interface DailyPlan {
  id: string
  user_id: string
  date: string
  energy_level: EnergyLevel
  available_minutes: number
  status: PlanStatus
  created_at: string
  completed_at: string | null
}

export interface PlannedTask {
  id: string
  plan_id: string
  task_id: string
  order: number
  status: PlannedTaskStatus
  started_at: string | null
  completed_at: string | null
  actual_minutes: number | null
  // Joined from tasks table
  task?: Task
}

export interface TaskScore {
  task: Task
  total: number
  breakdown: {
    deadlineUrgency: number
    priorityMatch: number
    energyMatch: number
    timeFit: number
    aging: number
  }
}

// Time budget options in minutes
export const TIME_BUDGETS = [
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "6 hours", value: 360 },
  { label: "8 hours", value: 480 },
] as const

// Scoring algorithm constants
const SCORES = {
  DEADLINE: {
    PAST_DUE: 40,
    TODAY: 35,
    TOMORROW: 25,
    THIS_WEEK: 15,
    THIS_MONTH: 5,
    NONE: 0,
  },
  PRIORITY: {
    high: 30,
    medium: 15,
    low: 5,
  },
  ENERGY: {
    PERFECT: 20,
    ADJACENT: 10,
    OPPOSITE: 0,
  },
  TIME_FIT: {
    PERFECT: 10,
    CLOSE: 5,
    TOO_LONG: 0,
  },
  AGING_PER_DAY: 2, // 2 points per day carried over, max 10
}

export function useDailyPlanning() {
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null)
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  // Fetch today's plan
  const fetchTodayPlan = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: plan, error: planError } = await supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", PERSONAL_USER_ID)
        .eq("date", today)
        .single()

      if (planError && planError.code !== "PGRST116") {
        throw planError
      }

      if (plan) {
        setTodayPlan(plan)

        // Fetch planned tasks with joined task data
        const { data: tasks, error: tasksError } = await supabase
          .from("planned_tasks")
          .select(`
            *,
            task:tasks(*)
          `)
          .eq("plan_id", plan.id)
          .order("order", { ascending: true })

        if (tasksError) throw tasksError
        setPlannedTasks(tasks || [])
      } else {
        setTodayPlan(null)
        setPlannedTasks([])
      }
    } catch (err) {
      console.error("[DailyPlanning] Error fetching plan:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch plan")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, today])

  // Initial fetch
  useEffect(() => {
    fetchTodayPlan()
  }, [fetchTodayPlan])

  // Calculate deadline urgency score
  const calculateDeadlineScore = useCallback((deadline: string | null): number => {
    if (!deadline) return SCORES.DEADLINE.NONE

    const deadlineDate = new Date(deadline)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.ceil((deadlineDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return SCORES.DEADLINE.PAST_DUE
    if (diffDays === 0) return SCORES.DEADLINE.TODAY
    if (diffDays === 1) return SCORES.DEADLINE.TOMORROW
    if (diffDays <= 7) return SCORES.DEADLINE.THIS_WEEK
    if (diffDays <= 30) return SCORES.DEADLINE.THIS_MONTH
    return SCORES.DEADLINE.NONE
  }, [])

  // Calculate energy match score
  const calculateEnergyScore = useCallback((taskEnergy: string, userEnergy: EnergyLevel): number => {
    if (taskEnergy === userEnergy) return SCORES.ENERGY.PERFECT

    // Adjacent: high-normal, normal-low
    const energyOrder: EnergyLevel[] = ["high", "normal", "low"]
    const taskIdx = energyOrder.indexOf(taskEnergy as EnergyLevel)
    const userIdx = energyOrder.indexOf(userEnergy)

    if (Math.abs(taskIdx - userIdx) === 1) return SCORES.ENERGY.ADJACENT
    return SCORES.ENERGY.OPPOSITE
  }, [])

  // Calculate time fit score
  const calculateTimeFitScore = useCallback((estimatedMinutes: number, remainingMinutes: number): number => {
    if (estimatedMinutes <= remainingMinutes) {
      // Task fits - check how well
      const ratio = estimatedMinutes / remainingMinutes
      if (ratio >= 0.3 && ratio <= 0.7) return SCORES.TIME_FIT.PERFECT
      return SCORES.TIME_FIT.CLOSE
    }
    return SCORES.TIME_FIT.TOO_LONG
  }, [])

  // Calculate aging score (for carried-over tasks)
  const calculateAgingScore = useCallback((carriedFromDate: string | null): number => {
    if (!carriedFromDate) return 0

    const carried = new Date(carriedFromDate)
    const now = new Date()
    const daysCarried = Math.floor((now.getTime() - carried.getTime()) / (1000 * 60 * 60 * 24))

    return Math.min(daysCarried * SCORES.AGING_PER_DAY, 10)
  }, [])

  // Map task energy levels to our EnergyLevel type
  const mapTaskEnergy = useCallback((taskEnergy: string | undefined): EnergyLevel => {
    // Task uses peak/medium/low, we use high/normal/low
    if (taskEnergy === "peak") return "high"
    if (taskEnergy === "medium") return "normal"
    if (taskEnergy === "low") return "low"
    return "normal" // default
  }, [])

  // Score and rank tasks for planning
  const scoreTasksForPlanning = useCallback(
    (tasks: Task[], userEnergy: EnergyLevel, remainingMinutes: number): TaskScore[] => {
      return tasks
        .filter((task) => !task.completed && !task.skipped)
        .map((task) => {
          const taskPriority = task.priority || "medium"
          const taskEstimate = task.estimated_minutes || 25
          const taskEnergyMapped = mapTaskEnergy(task.energy_level)

          const breakdown = {
            deadlineUrgency: calculateDeadlineScore(task.deadline ?? null),
            priorityMatch: SCORES.PRIORITY[taskPriority as keyof typeof SCORES.PRIORITY] || 0,
            energyMatch: calculateEnergyScore(taskEnergyMapped, userEnergy),
            timeFit: calculateTimeFitScore(taskEstimate, remainingMinutes),
            aging: calculateAgingScore((task as Task & { carried_from_date?: string }).carried_from_date ?? null),
          }

          const total =
            breakdown.deadlineUrgency +
            breakdown.priorityMatch +
            breakdown.energyMatch +
            breakdown.timeFit +
            breakdown.aging

          return { task, total, breakdown }
        })
        .sort((a, b) => b.total - a.total)
    },
    [calculateDeadlineScore, calculateEnergyScore, calculateTimeFitScore, calculateAgingScore, mapTaskEnergy]
  )

  // Create a new daily plan
  const createPlan = useCallback(
    async (energyLevel: EnergyLevel, availableMinutes: number, selectedTaskIds: string[]): Promise<DailyPlan | null> => {
      try {
        // Create the plan
        const { data: plan, error: planError } = await supabase
          .from("daily_plans")
          .insert({
            user_id: PERSONAL_USER_ID,
            date: today,
            energy_level: energyLevel,
            available_minutes: availableMinutes,
            status: "active",
          })
          .select()
          .single()

        if (planError) throw planError

        // Create planned tasks
        if (selectedTaskIds.length > 0) {
          const plannedTasksData = selectedTaskIds.map((taskId, index) => ({
            plan_id: plan.id,
            task_id: taskId,
            order: index,
            status: "pending" as PlannedTaskStatus,
          }))

          const { error: tasksError } = await supabase.from("planned_tasks").insert(plannedTasksData)

          if (tasksError) throw tasksError
        }

        await fetchTodayPlan()
        return plan
      } catch (err) {
        console.error("[DailyPlanning] Error creating plan:", err)
        setError(err instanceof Error ? err.message : "Failed to create plan")
        return null
      }
    },
    [supabase, today, fetchTodayPlan]
  )

  // Get the next task to work on
  const nextPlannedTask = useMemo(() => {
    return plannedTasks.find((pt) => pt.status === "pending" || pt.status === "in_progress") || null
  }, [plannedTasks])

  // Start working on a task
  const startTask = useCallback(
    async (plannedTaskId: string) => {
      try {
        const { error } = await supabase
          .from("planned_tasks")
          .update({
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .eq("id", plannedTaskId)

        if (error) throw error

        setPlannedTasks((prev) =>
          prev.map((pt) =>
            pt.id === plannedTaskId ? { ...pt, status: "in_progress" as PlannedTaskStatus, started_at: new Date().toISOString() } : pt
          )
        )
      } catch (err) {
        console.error("[DailyPlanning] Error starting task:", err)
        setError(err instanceof Error ? err.message : "Failed to start task")
      }
    },
    [supabase]
  )

  // Complete a planned task
  const completeTask = useCallback(
    async (plannedTaskId: string, actualMinutes?: number) => {
      try {
        const plannedTask = plannedTasks.find((pt) => pt.id === plannedTaskId)
        if (!plannedTask) return

        // Update planned task
        const { error: ptError } = await supabase
          .from("planned_tasks")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            actual_minutes: actualMinutes,
          })
          .eq("id", plannedTaskId)

        if (ptError) throw ptError

        // Also mark the actual task as completed
        const { error: taskError } = await supabase
          .from("tasks")
          .update({ completed: true })
          .eq("id", plannedTask.task_id)

        if (taskError) throw taskError

        setPlannedTasks((prev) =>
          prev.map((pt) =>
            pt.id === plannedTaskId
              ? {
                  ...pt,
                  status: "completed" as PlannedTaskStatus,
                  completed_at: new Date().toISOString(),
                  actual_minutes: actualMinutes ?? null,
                }
              : pt
          )
        )
      } catch (err) {
        console.error("[DailyPlanning] Error completing task:", err)
        setError(err instanceof Error ? err.message : "Failed to complete task")
      }
    },
    [supabase, plannedTasks]
  )

  // Skip a planned task
  const skipTask = useCallback(
    async (plannedTaskId: string) => {
      try {
        const { error } = await supabase
          .from("planned_tasks")
          .update({ status: "skipped" })
          .eq("id", plannedTaskId)

        if (error) throw error

        setPlannedTasks((prev) =>
          prev.map((pt) => (pt.id === plannedTaskId ? { ...pt, status: "skipped" as PlannedTaskStatus } : pt))
        )
      } catch (err) {
        console.error("[DailyPlanning] Error skipping task:", err)
        setError(err instanceof Error ? err.message : "Failed to skip task")
      }
    },
    [supabase]
  )

  // Defer a task to tomorrow
  const deferTask = useCallback(
    async (plannedTaskId: string) => {
      try {
        const plannedTask = plannedTasks.find((pt) => pt.id === plannedTaskId)
        if (!plannedTask) return

        // Mark as deferred in planned_tasks
        const { error: ptError } = await supabase
          .from("planned_tasks")
          .update({ status: "deferred" })
          .eq("id", plannedTaskId)

        if (ptError) throw ptError

        // Mark task with carried_from_date for aging bonus tomorrow
        const { error: taskError } = await supabase
          .from("tasks")
          .update({ carried_from_date: today })
          .eq("id", plannedTask.task_id)

        if (taskError) throw taskError

        setPlannedTasks((prev) =>
          prev.map((pt) => (pt.id === plannedTaskId ? { ...pt, status: "deferred" as PlannedTaskStatus } : pt))
        )
      } catch (err) {
        console.error("[DailyPlanning] Error deferring task:", err)
        setError(err instanceof Error ? err.message : "Failed to defer task")
      }
    },
    [supabase, plannedTasks, today]
  )

  // Complete the day's plan
  const completePlan = useCallback(async () => {
    if (!todayPlan) return

    try {
      const { error } = await supabase
        .from("daily_plans")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", todayPlan.id)

      if (error) throw error

      setTodayPlan((prev) => (prev ? { ...prev, status: "completed", completed_at: new Date().toISOString() } : null))
    } catch (err) {
      console.error("[DailyPlanning] Error completing plan:", err)
      setError(err instanceof Error ? err.message : "Failed to complete plan")
    }
  }, [supabase, todayPlan])

  // Progress calculations
  const progress = useMemo(() => {
    const total = plannedTasks.length
    const completed = plannedTasks.filter((pt) => pt.status === "completed").length
    const inProgress = plannedTasks.filter((pt) => pt.status === "in_progress").length

    // Calculate elapsed time from started tasks
    const elapsedMinutes = plannedTasks
      .filter((pt) => pt.status === "completed" || pt.status === "in_progress")
      .reduce((acc, pt) => {
        if (pt.actual_minutes) return acc + pt.actual_minutes
        if (pt.started_at) {
          const started = new Date(pt.started_at)
          const now = pt.completed_at ? new Date(pt.completed_at) : new Date()
          return acc + Math.round((now.getTime() - started.getTime()) / 60000)
        }
        return acc
      }, 0)

    const remainingMinutes = todayPlan ? todayPlan.available_minutes - elapsedMinutes : 0

    return {
      total,
      completed,
      inProgress,
      remaining: total - completed,
      elapsedMinutes,
      remainingMinutes: Math.max(0, remainingMinutes),
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [plannedTasks, todayPlan])

  // Check if plan exists for today
  const hasPlanForToday = !!todayPlan

  // Check if all tasks are done
  const allTasksCompleted = plannedTasks.length > 0 && plannedTasks.every((pt) => pt.status === "completed" || pt.status === "skipped" || pt.status === "deferred")

  // Legacy compatibility - show planning if no plan exists
  const shouldShowPlanning = !isLoading && !hasPlanForToday

  return {
    // State
    todayPlan,
    plannedTasks,
    isLoading,
    error,
    hasPlanForToday,
    allTasksCompleted,
    nextPlannedTask,
    progress,
    shouldShowPlanning,

    // Actions
    fetchTodayPlan,
    createPlan,
    startTask,
    completeTask,
    skipTask,
    deferTask,
    completePlan,

    // Utilities
    scoreTasksForPlanning,
  }
}
