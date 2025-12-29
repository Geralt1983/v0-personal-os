import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createClient } from "@/lib/supabase/client"

export type View = "task" | "dashboard" | "settings" | "taskList" | "habits"
export type EnergyLevel = "peak" | "medium" | "low"
export type AITone = "encouraging" | "stoic" | "urgent"

interface ModalState {
  commandPalette: boolean
  voiceReminder: boolean
  addTask: boolean
  menuDrawer: boolean
  stuckTask: boolean
  breakdown: boolean
  dailyPlanning: boolean
  shameFreeReset: boolean
  statModal: "streak" | "trust" | null
}

interface Preferences {
  soundEnabled: boolean
  hapticEnabled: boolean
  confettiEnabled: boolean
  showTrustScore: boolean
  showStreak: boolean
  reduceAnimations: boolean
  theme: "dark" | "light"
  accentColor: string
  aiReasoningStyle: AITone
  autoBreakdown: boolean
  defaultDurationMinutes: number
  autoStartBreaks: boolean
}

interface CelebrationContext {
  isVisible: boolean
  wasQuickWin: boolean
  wasOverdue: boolean
  wasFromBreakdown: boolean
  wasPostReset: boolean
  stepsCompleted: number
  taskTitle: string
}

interface ResetState {
  lastResetDate: string | null
  resetCount: number
}

interface AppState {
  // View Management
  currentView: View
  modals: ModalState
  editingTask: any | null

  // Session State
  userEnergyLevel: EnergyLevel
  timerRunning: boolean
  timeLeft: number
  defaultTimerMinutes: number
  tasksCompletedToday: number
  lastPlanningDate: string | null

  // Preferences State
  preferences: Preferences

  // Celebration State
  celebration: CelebrationContext

  // Reset State
  resetState: ResetState

  // View Actions
  setView: (view: View) => void
  openModal: (modal: keyof Omit<ModalState, "statModal">) => void
  closeModal: (modal: keyof Omit<ModalState, "statModal">) => void
  openStatModal: (type: "streak" | "trust") => void
  closeStatModal: () => void
  closeAllModals: () => void
  setEditingTask: (task: any | null) => void
  navigateAndClose: (view: View) => void

  // Session Actions
  setUserEnergy: (level: EnergyLevel) => void
  setTimerRunning: (running: boolean) => void
  setTimeLeft: (seconds: number) => void
  decrementTimer: () => void
  resetTimer: () => void
  incrementTasksCompleted: () => void
  completePlanning: () => void
  shouldShowPlanning: () => boolean

  // Preference Actions
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void

  // Celebration Actions
  triggerCelebration: (ctx: Partial<Omit<CelebrationContext, "isVisible">>) => void
  dismissCelebration: () => void

  // Reset Actions
  shameFreeReset: () => Promise<{ success: boolean; message?: string }>
  isPostReset: () => boolean
}

const initialModals: ModalState = {
  commandPalette: false,
  voiceReminder: false,
  addTask: false,
  menuDrawer: false,
  stuckTask: false,
  breakdown: false,
  dailyPlanning: false,
  shameFreeReset: false,
  statModal: null,
}

const initialPreferences: Preferences = {
  soundEnabled: true,
  hapticEnabled: true,
  confettiEnabled: true,
  showTrustScore: true,
  showStreak: true,
  reduceAnimations: false,
  theme: "dark",
  accentColor: "cyan",
  aiReasoningStyle: "encouraging",
  autoBreakdown: false,
  defaultDurationMinutes: 25,
  autoStartBreaks: false,
}

const initialCelebration: CelebrationContext = {
  isVisible: false,
  wasQuickWin: false,
  wasOverdue: false,
  wasFromBreakdown: false,
  wasPostReset: false,
  stepsCompleted: 0,
  taskTitle: "",
}

const initialResetState: ResetState = {
  lastResetDate: null,
  resetCount: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentView: "task",
      modals: initialModals,
      editingTask: null,
      userEnergyLevel: "medium",
      timerRunning: false,
      timeLeft: 25 * 60,
      defaultTimerMinutes: 25,
      tasksCompletedToday: 0,
      lastPlanningDate: null,
      preferences: initialPreferences,
      celebration: initialCelebration,
      resetState: initialResetState,

      // View Actions
      setView: (view) => set({ currentView: view }),

      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),

      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),

      openStatModal: (type) =>
        set((state) => ({
          modals: { ...state.modals, statModal: type },
        })),

      closeStatModal: () =>
        set((state) => ({
          modals: { ...state.modals, statModal: null },
        })),

      closeAllModals: () => set({ modals: initialModals }),

      setEditingTask: (task) => set({ editingTask: task }),

      navigateAndClose: (view) =>
        set({
          currentView: view,
          modals: initialModals,
        }),

      // Session Actions
      setUserEnergy: (level) => set({ userEnergyLevel: level }),

      setTimerRunning: (running) => set({ timerRunning: running }),

      setTimeLeft: (seconds) => set({ timeLeft: seconds }),

      decrementTimer: () =>
        set((state) => ({
          timeLeft: Math.max(0, state.timeLeft - 1),
        })),

      resetTimer: () =>
        set((state) => ({
          timeLeft: state.preferences.defaultDurationMinutes * 60,
          timerRunning: false,
        })),

      incrementTasksCompleted: () =>
        set((state) => ({
          tasksCompletedToday: state.tasksCompletedToday + 1,
        })),

      completePlanning: () =>
        set({
          lastPlanningDate: new Date().toDateString(),
        }),

      shouldShowPlanning: () => {
        const state = get()
        const today = new Date().toDateString()
        return state.lastPlanningDate !== today
      },

      // Preference Actions
      updatePreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      // Celebration Actions
      triggerCelebration: (ctx) =>
        set((state) => ({
          celebration: {
            isVisible: true,
            wasQuickWin: ctx.wasQuickWin ?? false,
            wasOverdue: ctx.wasOverdue ?? false,
            wasFromBreakdown: ctx.wasFromBreakdown ?? false,
            wasPostReset: ctx.wasPostReset ?? get().isPostReset(),
            stepsCompleted: ctx.stepsCompleted ?? 0,
            taskTitle: ctx.taskTitle ?? "",
          },
        })),
      dismissCelebration: () =>
        set({
          celebration: initialCelebration,
        }),

      // Reset Actions
      shameFreeReset: async () => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return { success: false, message: "Not authenticated" }
        }

        try {
          const now = new Date().toISOString()

          // Archive overdue tasks
          await supabase
            .from("tasks")
            .update({
              skipped: true,
              skip_reason: "shame_free_reset",
              updated_at: now,
            })
            .eq("user_id", user.id)
            .eq("completed", false)
            .eq("skipped", false)
            .not("deadline", "is", null)
            .lt("deadline", now)

          // Archive already skipped tasks
          await supabase
            .from("tasks")
            .update({
              skip_reason: "shame_free_reset",
              updated_at: now,
            })
            .eq("user_id", user.id)
            .eq("skipped", true)
            .is("skip_reason", null)

          // Reset streak but preserve total_completed
          await supabase
            .from("user_stats")
            .update({
              current_streak: 0,
              last_completed_date: null,
              updated_at: now,
            })
            .eq("user_id", user.id)

          set((state) => ({
            tasksCompletedToday: 0,
            lastPlanningDate: null,
            currentView: "task",
            modals: { ...state.modals, shameFreeReset: false },
            resetState: {
              lastResetDate: new Date().toISOString(),
              resetCount: state.resetState.resetCount + 1,
            },
          }))

          return { success: true }
        } catch (error) {
          console.error("[LifeOS] Shame-free reset failed:", error)
          return { success: false, message: "Reset failed. Please try again." }
        }
      },

      isPostReset: () => {
        const state = get()
        if (!state.resetState.lastResetDate) return false

        const resetDate = new Date(state.resetState.lastResetDate)
        const now = new Date()
        const hoursSinceReset = (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60)

        return hoursSinceReset < 24
      },
    }),
    {
      name: "lifeos-app-store",
      partialize: (state) => ({
        currentView: state.currentView,
        userEnergyLevel: state.userEnergyLevel,
        defaultTimerMinutes: state.defaultTimerMinutes,
        lastPlanningDate: state.lastPlanningDate,
        preferences: state.preferences,
        resetState: state.resetState,
      }),
    },
  ),
)
