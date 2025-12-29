/**
 * Goals Store
 *
 * Zustand store for OKR-style goals management.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GoalWithProgress, KeyResult, GoalTimeframe, GoalStatus } from "@/lib/goals/types"

interface GoalsState {
  // Data
  goals: GoalWithProgress[]
  loading: boolean
  error: string | null

  // UI State
  selectedGoalId: string | null
  timeframeFilter: GoalTimeframe | "all"
  statusFilter: GoalStatus | "all"

  // Actions
  setGoals: (goals: GoalWithProgress[]) => void
  addGoal: (goal: GoalWithProgress) => void
  updateGoal: (id: string, updates: Partial<GoalWithProgress>) => void
  removeGoal: (id: string) => void
  addKeyResult: (goalId: string, keyResult: KeyResult) => void
  updateKeyResult: (goalId: string, keyResultId: string, updates: Partial<KeyResult>) => void
  removeKeyResult: (goalId: string, keyResultId: string) => void
  updateKeyResultProgress: (goalId: string, keyResultId: string, newValue: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedGoal: (id: string | null) => void
  setTimeframeFilter: (timeframe: GoalTimeframe | "all") => void
  setStatusFilter: (status: GoalStatus | "all") => void
  reset: () => void
}

const initialState = {
  goals: [],
  loading: false,
  error: null,
  selectedGoalId: null,
  timeframeFilter: "all" as const,
  statusFilter: "active" as GoalStatus,
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...initialState,

      setGoals: (goals) => set({ goals, loading: false }),

      addGoal: (goal) =>
        set((state) => ({
          goals: [goal, ...state.goals],
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
          ),
        })),

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          selectedGoalId: state.selectedGoalId === id ? null : state.selectedGoalId,
        })),

      addKeyResult: (goalId, keyResult) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  keyResults: [...g.keyResults, keyResult],
                  progress: calculateGoalProgress([...g.keyResults, keyResult]),
                }
              : g
          ),
        })),

      updateKeyResult: (goalId, keyResultId, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g
            const newKeyResults = g.keyResults.map((kr) =>
              kr.id === keyResultId ? { ...kr, ...updates } : kr
            )
            return {
              ...g,
              keyResults: newKeyResults,
              progress: calculateGoalProgress(newKeyResults),
            }
          }),
        })),

      removeKeyResult: (goalId, keyResultId) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g
            const newKeyResults = g.keyResults.filter((kr) => kr.id !== keyResultId)
            return {
              ...g,
              keyResults: newKeyResults,
              progress: calculateGoalProgress(newKeyResults),
            }
          }),
        })),

      updateKeyResultProgress: (goalId, keyResultId, newValue) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g
            const newKeyResults = g.keyResults.map((kr) =>
              kr.id === keyResultId
                ? { ...kr, current_value: newValue, updated_at: new Date().toISOString() }
                : kr
            )
            return {
              ...g,
              keyResults: newKeyResults,
              progress: calculateGoalProgress(newKeyResults),
            }
          }),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setSelectedGoal: (id) => set({ selectedGoalId: id }),

      setTimeframeFilter: (timeframe) => set({ timeframeFilter: timeframe }),

      setStatusFilter: (status) => set({ statusFilter: status }),

      reset: () => set(initialState),
    }),
    {
      name: "lifeos-goals-store",
      partialize: (state) => ({
        timeframeFilter: state.timeframeFilter,
        statusFilter: state.statusFilter,
      }),
    }
  )
)

function calculateGoalProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0

  const total = keyResults.reduce((sum, kr) => {
    const progress = Math.min((kr.current_value / kr.target_value) * 100, 100)
    return sum + progress
  }, 0)

  return Math.round(total / keyResults.length)
}
