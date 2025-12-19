"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .eq("skipped", false)
      .order("position", { ascending: true })

    if (data) {
      setTasks(data)
      setCurrentTask(data[0] || null)
    }
    setLoading(false)
  }

  const addTask = async (task: Partial<Task>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: user.id })
      .select()
      .single()

    if (data) {
      setTasks((prev) => [...prev, data])
      if (!currentTask) setCurrentTask(data)
    }
    return data
  }

  const completeTask = async (id: string) => {
    const previousTasks = tasks
    const previousCurrentTask = currentTask

    // Optimistically update UI immediately
    const nextTask = tasks.find((t) => t.id !== id) || null
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setCurrentTask(nextTask)

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      await updateStats("complete")
    } catch (error) {
      // Revert on error
      console.error("[v0] Error completing task:", error)
      setTasks(previousTasks)
      setCurrentTask(previousCurrentTask)
    }
  }

  const skipTask = async (id: string, reason?: string) => {
    const previousTasks = tasks
    const previousCurrentTask = currentTask

    // Optimistically update UI immediately
    const nextTask = tasks.find((t) => t.id !== id) || null
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setCurrentTask(nextTask)

    try {
      const { error } = await supabase.from("tasks").update({ skipped: true, skip_reason: reason }).eq("id", id)

      if (error) throw error

      await updateStats("skip")
    } catch (error) {
      // Revert on error
      console.error("[v0] Error skipping task:", error)
      setTasks(previousTasks)
      setCurrentTask(previousCurrentTask)
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (currentTask?.id === id) {
        const nextTask = tasks.find((t) => t.id !== id) || null
        setCurrentTask(nextTask)
      }
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single()

    if (data && !error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
      if (currentTask?.id === id) {
        setCurrentTask(data)
      }
    }
    return data
  }

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
    const isConsecutiveDay = stats.last_completed_date === yesterday

    const updates = {
      total_completed: action === "complete" ? stats.total_completed + 1 : stats.total_completed,
      total_skipped: action === "skip" ? stats.total_skipped + 1 : stats.total_skipped,
      current_streak:
        action === "complete"
          ? isConsecutiveDay || stats.last_completed_date === today
            ? stats.current_streak + 1
            : 1
          : stats.current_streak,
      trust_score: Math.min(100, Math.max(0, action === "complete" ? stats.trust_score + 2 : stats.trust_score - 5)),
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
    refetch: fetchTasks,
  }
}
