import { create } from "zustand"
import { persist } from "zustand/middleware"

export type View = "task" | "dashboard" | "settings" | "taskList"
export type EnergyLevel = "peak" | "medium" | "low"

interface ModalState {
  commandPalette: boolean
  voiceReminder: boolean
  addTask: boolean
  menuDrawer: boolean
  stuckTask: boolean
  breakdown: boolean
  dailyPlanning: boolean
  statModal: "streak" | "trust" | null
}

interface CelebrationContext {
  isVisible: boolean
  wasQuickWin: boolean
  wasOverdue: boolean
  wasFromBreakdown: boolean
  stepsCompleted: number
  taskTitle: string
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

  // Celebration State
  celebration: CelebrationContext

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

  // Celebration Actions
  triggerCelebration: (ctx: Partial<Omit<CelebrationContext, "isVisible">>) => void
  dismissCelebration: () => void
}

const initialModals: ModalState = {
  commandPalette: false,
  voiceReminder: false,
  addTask: false,
  menuDrawer: false,
  stuckTask: false,
  breakdown: false,
  dailyPlanning: false,
  statModal: null,
}

const initialCelebration: CelebrationContext = {
  isVisible: false,
  wasQuickWin: false,
  wasOverdue: false,
  wasFromBreakdown: false,
  stepsCompleted: 0,
  taskTitle: "",
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
      celebration: initialCelebration,

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
          timeLeft: state.defaultTimerMinutes * 60,
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

      // Celebration Actions
      triggerCelebration: (ctx) =>
        set({
          celebration: {
            isVisible: true,
            wasQuickWin: ctx.wasQuickWin ?? false,
            wasOverdue: ctx.wasOverdue ?? false,
            wasFromBreakdown: ctx.wasFromBreakdown ?? false,
            stepsCompleted: ctx.stepsCompleted ?? 0,
            taskTitle: ctx.taskTitle ?? "",
          },
        }),

      dismissCelebration: () =>
        set({
          celebration: initialCelebration,
        }),
    }),
    {
      name: "lifeos-app-store",
      partialize: (state) => ({
        currentView: state.currentView,
        userEnergyLevel: state.userEnergyLevel,
        defaultTimerMinutes: state.defaultTimerMinutes,
        lastPlanningDate: state.lastPlanningDate,
      }),
    },
  ),
)
