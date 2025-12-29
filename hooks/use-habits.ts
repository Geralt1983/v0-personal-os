"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useHabitsStore } from "@/lib/stores/habits-store"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type {
  Habit,
  HabitWithStats,
  CreateHabitInput,
  UpdateHabitInput,
  HabitCompletion,
} from "@/lib/habits/types"

export function useHabits() {
  const supabase = createClient()
  const {
    habits,
    loading,
    error,
    selectedHabitId,
    showArchived,
    setHabits,
    addHabit,
    updateHabit: updateHabitInStore,
    removeHabit,
    markCompleted: markCompletedInStore,
    setLoading,
    setError,
    setSelectedHabit,
    toggleShowArchived,
  } = useHabitsStore()

  const fetchHabits = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", PERSONAL_USER_ID)
        .eq("archived", showArchived)
        .order("created_at", { ascending: false })

      if (habitsError) throw habitsError

      // Fetch today's completions
      const today = new Date().toISOString().split("T")[0]
      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", PERSONAL_USER_ID)
        .gte("completed_at", `${today}T00:00:00`)
        .lte("completed_at", `${today}T23:59:59`)

      const completedTodaySet = new Set(completionsData?.map((c) => c.habit_id) || [])

      // Fetch this week's completions
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const { data: weekCompletions } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", PERSONAL_USER_ID)
        .gte("completed_at", weekStart.toISOString())

      const weekCompletionsMap = new Map<string, number>()
      weekCompletions?.forEach((c) => {
        weekCompletionsMap.set(c.habit_id, (weekCompletionsMap.get(c.habit_id) || 0) + 1)
      })

      // Combine data
      const habitsWithStats: HabitWithStats[] = (habitsData || []).map((habit: Habit) => ({
        ...habit,
        completedToday: completedTodaySet.has(habit.id),
        completionsThisWeek: weekCompletionsMap.get(habit.id) || 0,
        isOnTrack: calculateIsOnTrack(habit, weekCompletionsMap.get(habit.id) || 0),
      }))

      setHabits(habitsWithStats)
    } catch (err) {
      console.error("[LifeOS] Failed to fetch habits:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch habits")
    }
  }, [supabase, showArchived, setHabits, setLoading, setError])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const createHabit = useCallback(
    async (input: CreateHabitInput) => {
      try {
        const { data, error } = await supabase
          .from("habits")
          .insert({
            user_id: PERSONAL_USER_ID,
            title: input.title,
            description: input.description,
            icon: input.icon || "🎯",
            color: input.color || "#06b6d4",
            frequency: input.frequency,
            reminder_time: input.reminder_time,
            streak_current: 0,
            streak_best: 0,
            total_completions: 0,
            archived: false,
          })
          .select()
          .single()

        if (error) throw error

        const newHabit: HabitWithStats = {
          ...data,
          completedToday: false,
          completionsThisWeek: 0,
          isOnTrack: true,
        }

        addHabit(newHabit)
        return newHabit
      } catch (err) {
        console.error("[LifeOS] Failed to create habit:", err)
        setError(err instanceof Error ? err.message : "Failed to create habit")
        return null
      }
    },
    [supabase, addHabit, setError]
  )

  const updateHabit = useCallback(
    async (id: string, input: UpdateHabitInput) => {
      try {
        const { data, error } = await supabase
          .from("habits")
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        updateHabitInStore(id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update habit:", err)
        setError(err instanceof Error ? err.message : "Failed to update habit")
        return null
      }
    },
    [supabase, updateHabitInStore, setError]
  )

  const deleteHabit = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("habits").delete().eq("id", id)

        if (error) throw error

        removeHabit(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete habit:", err)
        setError(err instanceof Error ? err.message : "Failed to delete habit")
        return false
      }
    },
    [supabase, removeHabit, setError]
  )

  const archiveHabit = useCallback(
    async (id: string) => {
      return updateHabit(id, { archived: true })
    },
    [updateHabit]
  )

  const completeHabit = useCallback(
    async (id: string, notes?: string) => {
      try {
        // Check if already completed today
        const habit = habits.find((h) => h.id === id)
        if (habit?.completedToday) {
          return false
        }

        // Insert completion record
        const { error: completionError } = await supabase.from("habit_completions").insert({
          habit_id: id,
          user_id: PERSONAL_USER_ID,
          completed_at: new Date().toISOString(),
          notes,
        })

        if (completionError) throw completionError

        // Update habit stats
        const currentHabit = habits.find((h) => h.id === id)
        if (currentHabit) {
          const newStreak = currentHabit.streak_current + 1
          const { error: updateError } = await supabase
            .from("habits")
            .update({
              streak_current: newStreak,
              streak_best: Math.max(currentHabit.streak_best, newStreak),
              total_completions: currentHabit.total_completions + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)

          if (updateError) throw updateError
        }

        markCompletedInStore(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to complete habit:", err)
        setError(err instanceof Error ? err.message : "Failed to complete habit")
        return false
      }
    },
    [supabase, habits, markCompletedInStore, setError]
  )

  const getHabitCompletions = useCallback(
    async (habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> => {
      try {
        const { data, error } = await supabase
          .from("habit_completions")
          .select("*")
          .eq("habit_id", habitId)
          .gte("completed_at", startDate.toISOString())
          .lte("completed_at", endDate.toISOString())
          .order("completed_at", { ascending: false })

        if (error) throw error
        return data || []
      } catch (err) {
        console.error("[LifeOS] Failed to fetch completions:", err)
        return []
      }
    },
    [supabase]
  )

  return {
    habits,
    loading,
    error,
    selectedHabitId,
    showArchived,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    completeHabit,
    getHabitCompletions,
    setSelectedHabit,
    toggleShowArchived,
    refetch: fetchHabits,
  }
}

/**
 * Calculate if a habit is on track for its frequency goal
 */
function calculateIsOnTrack(habit: Habit, completionsThisWeek: number): boolean {
  const { frequency } = habit
  const today = new Date().getDay()

  switch (frequency.type) {
    case "daily":
      // For daily habits, check if we're caught up
      return completionsThisWeek >= today || today === 0

    case "weekly":
      // For weekly habits, check if we've hit the target days
      const expectedByNow = frequency.days?.filter((d) => d <= today).length || 0
      return completionsThisWeek >= expectedByNow

    case "custom":
      // For custom, check against times per period
      const timesNeeded = frequency.timesPerPeriod || 1
      const daysIntoWeek = today === 0 ? 7 : today
      const expectedProgress = Math.floor((timesNeeded / 7) * daysIntoWeek)
      return completionsThisWeek >= expectedProgress

    default:
      return true
  }
}
