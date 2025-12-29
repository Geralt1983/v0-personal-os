"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useGoalsStore } from "@/lib/stores/goals-store"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type {
  Goal,
  GoalWithProgress,
  KeyResult,
  CreateGoalInput,
  UpdateGoalInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  GoalTimeframe,
} from "@/lib/goals/types"

export function useGoals() {
  const supabase = createClient()
  const {
    goals,
    loading,
    error,
    selectedGoalId,
    timeframeFilter,
    statusFilter,
    setGoals,
    addGoal,
    updateGoal: updateGoalInStore,
    removeGoal,
    addKeyResult: addKeyResultToStore,
    updateKeyResult: updateKeyResultInStore,
    removeKeyResult: removeKeyResultFromStore,
    updateKeyResultProgress: updateProgressInStore,
    setLoading,
    setError,
    setSelectedGoal,
    setTimeframeFilter,
    setStatusFilter,
  } = useGoalsStore()

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch goals
      let query = supabase.from("goals").select("*").eq("user_id", PERSONAL_USER_ID)

      if (timeframeFilter !== "all") {
        query = query.eq("timeframe", timeframeFilter)
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data: goalsData, error: goalsError } = await query.order("created_at", {
        ascending: false,
      })

      if (goalsError) throw goalsError

      // Fetch key results for all goals
      const goalIds = (goalsData || []).map((g: Goal) => g.id)
      const { data: keyResultsData } = await supabase
        .from("key_results")
        .select("*")
        .in("goal_id", goalIds)

      const keyResultsMap = new Map<string, KeyResult[]>()
      keyResultsData?.forEach((kr: KeyResult) => {
        const existing = keyResultsMap.get(kr.goal_id) || []
        keyResultsMap.set(kr.goal_id, [...existing, kr])
      })

      // Combine data with progress calculation
      const goalsWithProgress: GoalWithProgress[] = (goalsData || []).map((goal: Goal) => {
        const keyResults = keyResultsMap.get(goal.id) || []
        const progress = calculateProgress(keyResults)
        const endDate = new Date(goal.end_date)
        const now = new Date()
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...goal,
          keyResults,
          progress,
          daysRemaining: Math.max(0, daysRemaining),
          isOverdue: daysRemaining < 0 && goal.status === "active",
        }
      })

      setGoals(goalsWithProgress)
    } catch (err) {
      console.error("[LifeOS] Failed to fetch goals:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch goals")
    }
  }, [supabase, timeframeFilter, statusFilter, setGoals, setLoading, setError])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      try {
        // Calculate dates based on timeframe
        const { startDate, endDate } = calculateDates(input.timeframe, input.start_date, input.end_date)

        const { data, error } = await supabase
          .from("goals")
          .insert({
            user_id: PERSONAL_USER_ID,
            title: input.title,
            description: input.description,
            icon: input.icon || "🎯",
            color: input.color || "#f59e0b",
            timeframe: input.timeframe,
            start_date: startDate,
            end_date: endDate,
            status: "active",
            project_id: input.project_id,
          })
          .select()
          .single()

        if (error) throw error

        const newGoal: GoalWithProgress = {
          ...data,
          keyResults: [],
          progress: 0,
          daysRemaining: Math.ceil(
            (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
          isOverdue: false,
        }

        addGoal(newGoal)
        return newGoal
      } catch (err) {
        console.error("[LifeOS] Failed to create goal:", err)
        setError(err instanceof Error ? err.message : "Failed to create goal")
        return null
      }
    },
    [supabase, addGoal, setError]
  )

  const updateGoal = useCallback(
    async (id: string, input: UpdateGoalInput) => {
      try {
        const { data, error } = await supabase
          .from("goals")
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        updateGoalInStore(id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update goal:", err)
        setError(err instanceof Error ? err.message : "Failed to update goal")
        return null
      }
    },
    [supabase, updateGoalInStore, setError]
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        // Delete key results first
        await supabase.from("key_results").delete().eq("goal_id", id)
        await supabase.from("goal_check_ins").delete().eq("goal_id", id)

        const { error } = await supabase.from("goals").delete().eq("id", id)

        if (error) throw error

        removeGoal(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete goal:", err)
        setError(err instanceof Error ? err.message : "Failed to delete goal")
        return false
      }
    },
    [supabase, removeGoal, setError]
  )

  const completeGoal = useCallback(
    async (id: string) => {
      return updateGoal(id, { status: "completed" })
    },
    [updateGoal]
  )

  const abandonGoal = useCallback(
    async (id: string) => {
      return updateGoal(id, { status: "abandoned" })
    },
    [updateGoal]
  )

  // Key Result operations
  const createKeyResult = useCallback(
    async (input: CreateKeyResultInput) => {
      try {
        const { data, error } = await supabase
          .from("key_results")
          .insert({
            goal_id: input.goal_id,
            title: input.title,
            description: input.description,
            type: input.type,
            target_value: input.target_value,
            current_value: input.current_value || 0,
            unit: input.unit,
          })
          .select()
          .single()

        if (error) throw error

        addKeyResultToStore(input.goal_id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to create key result:", err)
        setError(err instanceof Error ? err.message : "Failed to create key result")
        return null
      }
    },
    [supabase, addKeyResultToStore, setError]
  )

  const updateKeyResult = useCallback(
    async (goalId: string, keyResultId: string, input: UpdateKeyResultInput) => {
      try {
        const { data, error } = await supabase
          .from("key_results")
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq("id", keyResultId)
          .select()
          .single()

        if (error) throw error

        updateKeyResultInStore(goalId, keyResultId, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update key result:", err)
        setError(err instanceof Error ? err.message : "Failed to update key result")
        return null
      }
    },
    [supabase, updateKeyResultInStore, setError]
  )

  const deleteKeyResult = useCallback(
    async (goalId: string, keyResultId: string) => {
      try {
        const { error } = await supabase.from("key_results").delete().eq("id", keyResultId)

        if (error) throw error

        removeKeyResultFromStore(goalId, keyResultId)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete key result:", err)
        setError(err instanceof Error ? err.message : "Failed to delete key result")
        return false
      }
    },
    [supabase, removeKeyResultFromStore, setError]
  )

  // Progress check-in
  const checkInProgress = useCallback(
    async (goalId: string, keyResultId: string, newValue: number, notes?: string) => {
      try {
        // Get current value
        const goal = goals.find((g) => g.id === goalId)
        const keyResult = goal?.keyResults.find((kr) => kr.id === keyResultId)
        const previousValue = keyResult?.current_value || 0

        // Record check-in
        await supabase.from("goal_check_ins").insert({
          goal_id: goalId,
          user_id: PERSONAL_USER_ID,
          key_result_id: keyResultId,
          previous_value: previousValue,
          new_value: newValue,
          notes,
        })

        // Update key result
        const { error } = await supabase
          .from("key_results")
          .update({
            current_value: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", keyResultId)

        if (error) throw error

        updateProgressInStore(goalId, keyResultId, newValue)

        // Check if goal is now complete
        const updatedGoal = goals.find((g) => g.id === goalId)
        if (updatedGoal) {
          const updatedKeyResults = updatedGoal.keyResults.map((kr) =>
            kr.id === keyResultId ? { ...kr, current_value: newValue } : kr
          )
          const progress = calculateProgress(updatedKeyResults)
          if (progress >= 100) {
            await updateGoal(goalId, { status: "completed" })
          }
        }

        return true
      } catch (err) {
        console.error("[LifeOS] Failed to check in progress:", err)
        setError(err instanceof Error ? err.message : "Failed to check in progress")
        return false
      }
    },
    [supabase, goals, updateProgressInStore, updateGoal, setError]
  )

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null

  return {
    goals,
    selectedGoal,
    loading,
    error,
    timeframeFilter,
    statusFilter,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    abandonGoal,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
    checkInProgress,
    setSelectedGoal,
    setTimeframeFilter,
    setStatusFilter,
    refetch: fetchGoals,
  }
}

function calculateProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0

  const total = keyResults.reduce((sum, kr) => {
    const progress = Math.min((kr.current_value / kr.target_value) * 100, 100)
    return sum + progress
  }, 0)

  return Math.round(total / keyResults.length)
}

function calculateDates(
  timeframe: GoalTimeframe,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  if (customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd }
  }

  switch (timeframe) {
    case "weekly":
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay()) // Start of week
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      break

    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    case "quarterly":
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      break

    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
      break

    default:
      startDate = now
      endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 3)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}
