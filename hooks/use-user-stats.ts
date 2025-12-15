"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface UserStats {
  user_id: string
  current_streak: number
  longest_streak: number
  trust_score: number
  total_completed: number
  total_skipped: number
  last_completed_date?: string
  updated_at: string
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("user_stats_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stats",
        },
        () => {
          fetchStats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStats = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from("user_stats").select("*").eq("user_id", user.id).single()

    setStats(data)
    setLoading(false)
  }

  return { stats, loading, refetch: fetchStats }
}
