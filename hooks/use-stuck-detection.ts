"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface StuckTask {
  taskId: string
  skipCount: number
  lastSkipReason?: string
  lastSkippedAt: string
}

export function useStuckDetection(taskId: string | undefined) {
  const [stuckInfo, setStuckInfo] = useState<StuckTask | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!taskId || taskId.startsWith("optimistic-")) return
    checkStuckStatus(taskId)
  }, [taskId])

  const checkStuckStatus = async (id: string) => {
    if (id.startsWith("optimistic-")) return

    const { data } = await supabase
      .from("task_skip_history")
      .select("*")
      .eq("task_id", id)
      .order("skipped_at", { ascending: false })

    if (data && data.length >= 3) {
      setIsStuck(true)
      setStuckInfo({
        taskId: id,
        skipCount: data.length,
        lastSkipReason: data[0]?.reason,
        lastSkippedAt: data[0]?.skipped_at,
      })
    } else {
      setIsStuck(false)
      setStuckInfo(null)
    }
  }

  const recordSkip = async (taskId: string, reason?: string) => {
    if (taskId.startsWith("optimistic-")) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("task_skip_history").insert({
      task_id: taskId,
      user_id: user.id,
      reason: reason || null,
      skipped_at: new Date().toISOString(),
    })

    await checkStuckStatus(taskId)
  }

  return { isStuck, stuckInfo, recordSkip, checkStuckStatus }
}
