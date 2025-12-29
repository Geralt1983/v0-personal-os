/**
 * Habits Store
 *
 * Zustand store for habit tracking state management.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { HabitWithStats } from "@/lib/habits/types"

interface HabitsState {
  // Data
  habits: HabitWithStats[]
  loading: boolean
  error: string | null

  // UI State
  selectedHabitId: string | null
  showArchived: boolean

  // Actions
  setHabits: (habits: HabitWithStats[]) => void
  addHabit: (habit: HabitWithStats) => void
  updateHabit: (id: string, updates: Partial<HabitWithStats>) => void
  removeHabit: (id: string) => void
  markCompleted: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedHabit: (id: string | null) => void
  toggleShowArchived: () => void
  reset: () => void
}

const initialState = {
  habits: [],
  loading: false,
  error: null,
  selectedHabitId: null,
  showArchived: false,
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      ...initialState,

      setHabits: (habits) => set({ habits, loading: false }),

      addHabit: (habit) =>
        set((state) => ({
          habits: [...state.habits, habit],
        })),

      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h
          ),
        })),

      removeHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          selectedHabitId: state.selectedHabitId === id ? null : state.selectedHabitId,
        })),

      markCompleted: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completedToday: true,
                  streak_current: h.streak_current + 1,
                  streak_best: Math.max(h.streak_best, h.streak_current + 1),
                  total_completions: h.total_completions + 1,
                  completionsThisWeek: h.completionsThisWeek + 1,
                }
              : h
          ),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setSelectedHabit: (id) => set({ selectedHabitId: id }),

      toggleShowArchived: () =>
        set((state) => ({ showArchived: !state.showArchived })),

      reset: () => set(initialState),
    }),
    {
      name: "lifeos-habits-store",
      partialize: (state) => ({
        showArchived: state.showArchived,
      }),
    }
  )
)
