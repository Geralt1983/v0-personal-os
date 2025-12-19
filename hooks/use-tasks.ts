"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { smartSortTasks, type ScoredTask } from "@/lib/smart-sort"
import { useAppStore } from "@/lib/stores/app-store"

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  energy_level?: "peak" | "medium" | "low"
  priority?: "high" | "medium" | "low"
  estimated_minutes?: number
  deadline?: string
  completed: boolean
  completed_at?: string
  skipped: boolean
  skip_reason?: string
  position: number
  created_at: string
  updated_at: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<ScoredTask[]>([])
  const [currentTask, setCurrentTask] = useState<ScoredTask | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { userEnergyLevel, triggerCelebration, incrementTasksCompleted } = useAppStore()

  const fetchTasks = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .eq("skipped", false)
      .order("position", { ascending: true })

    if (data) {
      const sorted = smartSortTasks(data, { userEnergyLevel })
      setTasks(sorted)
      setCurrentTask(sorted[0] || null)
    }
    setLoading(false)
  }, [supabase, userEnergyLevel])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const resortForEnergy = useCallback(
    (energy: "peak" | "medium" | "low") => {
      const sorted = smartSortTasks(tasks, { userEnergyLevel: energy })
      setTasks(sorted)
      setCurrentTask(sorted[0] || null)
    },
    [tasks],
  )

  const completeTask = useCallback(
    async (id: string) => {
      const taskToComplete = tasks.find((t) => t.id === id)
      const previousTasks = [...tasks]
      const previousCurrentTask = currentTask

      const remainingTasks = tasks.filter((t) => t.id !== id)
      setTasks(remainingTasks)
      setCurrentTask(remainingTasks[0] || null)

      if (taskToComplete) {
        incrementTasksCompleted()
        triggerCelebration({
          taskTitle: taskToComplete.title,
          wasQuickWin: (taskToComplete.estimated_minutes || 25) <= 10,
          wasOverdue: taskToComplete.deadline ? new Date(taskToComplete.deadline) < new Date() : false,
        })
      }

      try {
        const { error } = await supabase
          .from("tasks")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("id", id)

        if (error) throw error
        await updateStats("complete")
      } catch (error) {
        console.error("[LifeOS] Complete failed, rolling back:", error)
        setTasks(previousTasks)
        setCurrentTask(previousCurrentTask)
      }
    },
    [tasks, currentTask, supabase, triggerCelebration, incrementTasksCompleted],
  )

  const skipTask = useCallback(
    async (id: string, reason?: string) => {
      const previousTasks = [...tasks]
      const previousCurrentTask = currentTask

      const remainingTasks = tasks.filter((t) => t.id !== id)
      setTasks(remainingTasks)
      setCurrentTask(remainingTasks[0] || null)

      try {
        const { error } = await supabase.from("tasks").update({ skipped: true, skip_reason: reason }).eq("id", id)

        if (error) throw error
        await updateStats("skip")
      } catch (error) {
        console.error("[LifeOS] Skip failed, rolling back:", error)
        setTasks(previousTasks)
        setCurrentTask(previousCurrentTask)
      }
    },
    [tasks, currentTask, supabase],
  )

  const addTask = useCallback(
    async (task: Partial<Task>) => {
      console.log("[v0] addTask called with:", task)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] addTask - user:", user?.id || "NO USER")

      if (!user) {
        console.log("[v0] addTask - No user found, returning null")
        return null
      }

      try {
        const insertData = {
          user_id: user.id,
          title: task.title,
          description: task.description || null,
          energy_level: task.energy_level || "medium",
          priority: task.priority || "medium",
          estimated_minutes: task.estimated_minutes || 25,
          deadline: task.deadline || null,
          completed: false,
          skipped: false,
          position: tasks.length,
        }

        console.log("[v0] addTask - inserting to Supabase:", insertData)

        const { data, error } = await supabase.from("tasks").insert(insertData).select().single()

        if (error) {
          console.error("[v0] addTask - Supabase error:", error.message, error.details, error.hint)
          throw error
        }

        console.log("[v0] addTask - Supabase success, task id:", data.id)

        await fetchTasks()

        return data
      } catch (error: any) {
        console.error("[v0] addTask - failed:", error?.message || error)
        return null
      }
    },
    [tasks, supabase, fetchTasks],
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const previousTasks = [...tasks]

      setTasks((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
        return smartSortTasks(updated, { userEnergyLevel })
      })

      try {
        const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("[LifeOS] Update failed:", error)
        setTasks(previousTasks)
        return null
      }
    },
    [tasks, supabase, userEnergyLevel],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const previousTasks = [...tasks]

      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (currentTask?.id === id) {
        const remaining = tasks.filter((t) => t.id !== id)
        setCurrentTask(remaining[0] || null)
      }

      try {
        const { error } = await supabase.from("tasks").delete().eq("id", id)
        if (error) throw error
      } catch (error) {
        console.error("[LifeOS] Delete failed:", error)
        setTasks(previousTasks)
      }
    },
    [tasks, currentTask, supabase],
  )

  const getAllTasks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return data || []
  }

  const updateStats = async (action: "complete" | "skip") => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).single()

    if (!stats) return

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    const isConsecutive = stats.last_completed_date === yesterday || stats.last_completed_date === today
    const isNewDay = stats.last_completed_date !== today

    const updates = {
      total_completed: action === "complete" ? stats.total_completed + 1 : stats.total_completed,
      total_skipped: action === "skip" ? stats.total_skipped + 1 : stats.total_skipped,
      current_streak:
        action === "complete"
          ? isConsecutive
            ? isNewDay
              ? stats.current_streak + 1
              : stats.current_streak
            : 1
          : stats.current_streak,
      trust_score: Math.min(100, Math.max(0, action === "complete" ? stats.trust_score + 2 : stats.trust_score - 3)),
      last_completed_date: action === "complete" ? today : stats.last_completed_date,
      updated_at: new Date().toISOString(),
    }

    await supabase.from("user_stats").update(updates).eq("user_id", user.id)
  }

  return {
    tasks,
    currentTask,
    loading,
    addTask,
    completeTask,
    skipTask,
    deleteTask,
    updateTask,
    getAllTasks,
    resortForEnergy,
    refetch: fetchTasks,
  }
}
