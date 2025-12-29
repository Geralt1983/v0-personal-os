/**
 * Projects Store
 *
 * Zustand store for project management state.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProjectWithStats, Milestone, ProjectStatus } from "@/lib/projects/types"

interface ProjectsState {
  // Data
  projects: ProjectWithStats[]
  loading: boolean
  error: string | null

  // UI State
  selectedProjectId: string | null
  statusFilter: ProjectStatus | "all"
  sortBy: "created" | "due_date" | "progress" | "name"

  // Actions
  setProjects: (projects: ProjectWithStats[]) => void
  addProject: (project: ProjectWithStats) => void
  updateProject: (id: string, updates: Partial<ProjectWithStats>) => void
  removeProject: (id: string) => void
  addMilestone: (projectId: string, milestone: Milestone) => void
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<Milestone>) => void
  removeMilestone: (projectId: string, milestoneId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedProject: (id: string | null) => void
  setStatusFilter: (status: ProjectStatus | "all") => void
  setSortBy: (sortBy: ProjectsState["sortBy"]) => void
  reset: () => void
}

const initialState = {
  projects: [],
  loading: false,
  error: null,
  selectedProjectId: null,
  statusFilter: "all" as const,
  sortBy: "created" as const,
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      ...initialState,

      setProjects: (projects) => set({ projects, loading: false }),

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        })),

      addMilestone: (projectId, milestone) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, milestones: [...p.milestones, milestone] }
              : p
          ),
        })),

      updateMilestone: (projectId, milestoneId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  milestones: p.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, ...updates } : m
                  ),
                }
              : p
          ),
        })),

      removeMilestone: (projectId, milestoneId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  milestones: p.milestones.filter((m) => m.id !== milestoneId),
                }
              : p
          ),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setSelectedProject: (id) => set({ selectedProjectId: id }),

      setStatusFilter: (status) => set({ statusFilter: status }),

      setSortBy: (sortBy) => set({ sortBy }),

      reset: () => set(initialState),
    }),
    {
      name: "lifeos-projects-store",
      partialize: (state) => ({
        statusFilter: state.statusFilter,
        sortBy: state.sortBy,
      }),
    }
  )
)
