"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useProjectsStore } from "@/lib/stores/projects-store"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type {
  Project,
  ProjectWithStats,
  Milestone,
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/projects/types"

export function useProjects() {
  const supabase = createClient()
  const {
    projects,
    loading,
    error,
    selectedProjectId,
    statusFilter,
    sortBy,
    setProjects,
    addProject,
    updateProject: updateProjectInStore,
    removeProject,
    addMilestone: addMilestoneToStore,
    updateMilestone: updateMilestoneInStore,
    removeMilestone: removeMilestoneFromStore,
    setLoading,
    setError,
    setSelectedProject,
    setStatusFilter,
    setSortBy,
  } = useProjectsStore()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch projects
      let query = supabase
        .from("projects")
        .select("*")
        .eq("user_id", PERSONAL_USER_ID)

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data: projectsData, error: projectsError } = await query

      if (projectsError) throw projectsError

      // Fetch milestones for all projects
      const projectIds = (projectsData || []).map((p: Project) => p.id)
      const { data: milestonesData } = await supabase
        .from("milestones")
        .select("*")
        .in("project_id", projectIds)
        .order("position", { ascending: true })

      const milestonesMap = new Map<string, Milestone[]>()
      milestonesData?.forEach((m: Milestone) => {
        const existing = milestonesMap.get(m.project_id) || []
        milestonesMap.set(m.project_id, [...existing, m])
      })

      // Fetch task counts
      const { data: taskCounts } = await supabase
        .from("project_tasks")
        .select("project_id, task_id, tasks!inner(completed)")
        .in("project_id", projectIds)

      const taskCountMap = new Map<string, { total: number; completed: number }>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      taskCounts?.forEach((pt: any) => {
        const existing = taskCountMap.get(pt.project_id) || { total: 0, completed: 0 }
        existing.total += 1
        const taskData = Array.isArray(pt.tasks) ? pt.tasks[0] : pt.tasks
        if (taskData?.completed) {
          existing.completed += 1
        }
        taskCountMap.set(pt.project_id, existing)
      })

      // Combine data
      const projectsWithStats: ProjectWithStats[] = (projectsData || []).map((project: Project) => {
        const counts = taskCountMap.get(project.id) || { total: 0, completed: 0 }
        const milestones = milestonesMap.get(project.id) || []

        return {
          ...project,
          milestones,
          taskCount: counts.total,
          completedTaskCount: counts.completed,
          progress: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
        }
      })

      // Sort projects
      const sorted = sortProjects(projectsWithStats, sortBy)
      setProjects(sorted)
    } catch (err) {
      console.error("[LifeOS] Failed to fetch projects:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch projects")
    }
  }, [supabase, statusFilter, sortBy, setProjects, setLoading, setError])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: PERSONAL_USER_ID,
            title: input.title,
            description: input.description,
            icon: input.icon || "📁",
            color: input.color || "#8b5cf6",
            due_date: input.due_date,
            status: "active",
          })
          .select()
          .single()

        if (error) throw error

        const newProject: ProjectWithStats = {
          ...data,
          milestones: [],
          taskCount: 0,
          completedTaskCount: 0,
          progress: 0,
        }

        addProject(newProject)
        return newProject
      } catch (err) {
        console.error("[LifeOS] Failed to create project:", err)
        setError(err instanceof Error ? err.message : "Failed to create project")
        return null
      }
    },
    [supabase, addProject, setError]
  )

  const updateProject = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        updateProjectInStore(id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update project:", err)
        setError(err instanceof Error ? err.message : "Failed to update project")
        return null
      }
    },
    [supabase, updateProjectInStore, setError]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        // Delete related data first
        await supabase.from("milestones").delete().eq("project_id", id)
        await supabase.from("project_tasks").delete().eq("project_id", id)

        const { error } = await supabase.from("projects").delete().eq("id", id)

        if (error) throw error

        removeProject(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete project:", err)
        setError(err instanceof Error ? err.message : "Failed to delete project")
        return false
      }
    },
    [supabase, removeProject, setError]
  )

  const archiveProject = useCallback(
    async (id: string) => {
      return updateProject(id, { status: "archived" })
    },
    [updateProject]
  )

  const completeProject = useCallback(
    async (id: string) => {
      return updateProject(id, { status: "completed" })
    },
    [updateProject]
  )

  // Milestone operations
  const createMilestone = useCallback(
    async (input: CreateMilestoneInput) => {
      try {
        // Get next position
        const project = projects.find((p) => p.id === input.project_id)
        const nextPosition = project?.milestones.length || 0

        const { data, error } = await supabase
          .from("milestones")
          .insert({
            project_id: input.project_id,
            title: input.title,
            description: input.description,
            due_date: input.due_date,
            status: "pending",
            position: nextPosition,
          })
          .select()
          .single()

        if (error) throw error

        addMilestoneToStore(input.project_id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to create milestone:", err)
        setError(err instanceof Error ? err.message : "Failed to create milestone")
        return null
      }
    },
    [supabase, projects, addMilestoneToStore, setError]
  )

  const updateMilestone = useCallback(
    async (projectId: string, milestoneId: string, input: UpdateMilestoneInput) => {
      try {
        const updateData: Record<string, unknown> = { ...input }
        if (input.status === "completed") {
          updateData.completed_at = new Date().toISOString()
        }

        const { data, error } = await supabase
          .from("milestones")
          .update(updateData)
          .eq("id", milestoneId)
          .select()
          .single()

        if (error) throw error

        updateMilestoneInStore(projectId, milestoneId, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update milestone:", err)
        setError(err instanceof Error ? err.message : "Failed to update milestone")
        return null
      }
    },
    [supabase, updateMilestoneInStore, setError]
  )

  const deleteMilestone = useCallback(
    async (projectId: string, milestoneId: string) => {
      try {
        const { error } = await supabase.from("milestones").delete().eq("id", milestoneId)

        if (error) throw error

        removeMilestoneFromStore(projectId, milestoneId)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete milestone:", err)
        setError(err instanceof Error ? err.message : "Failed to delete milestone")
        return false
      }
    },
    [supabase, removeMilestoneFromStore, setError]
  )

  // Task linking
  const linkTaskToProject = useCallback(
    async (projectId: string, taskId: string, milestoneId?: string) => {
      try {
        const { data, error } = await supabase
          .from("project_tasks")
          .insert({
            project_id: projectId,
            task_id: taskId,
            milestone_id: milestoneId,
            position: 0,
          })
          .select()
          .single()

        if (error) throw error

        await fetchProjects() // Refresh to get updated counts
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to link task:", err)
        setError(err instanceof Error ? err.message : "Failed to link task")
        return null
      }
    },
    [supabase, fetchProjects, setError]
  )

  const unlinkTaskFromProject = useCallback(
    async (projectId: string, taskId: string) => {
      try {
        const { error } = await supabase
          .from("project_tasks")
          .delete()
          .eq("project_id", projectId)
          .eq("task_id", taskId)

        if (error) throw error

        await fetchProjects() // Refresh to get updated counts
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to unlink task:", err)
        setError(err instanceof Error ? err.message : "Failed to unlink task")
        return false
      }
    },
    [supabase, fetchProjects, setError]
  )

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null

  return {
    projects,
    selectedProject,
    loading,
    error,
    statusFilter,
    sortBy,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    completeProject,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    linkTaskToProject,
    unlinkTaskFromProject,
    setSelectedProject,
    setStatusFilter,
    setSortBy,
    refetch: fetchProjects,
  }
}

function sortProjects(
  projects: ProjectWithStats[],
  sortBy: "created" | "due_date" | "progress" | "name"
): ProjectWithStats[] {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title)
      case "due_date":
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      case "progress":
        return b.progress - a.progress
      case "created":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
}
