"use client"

import { createClient } from "@/lib/supabase/client"
import { scheduleNotification } from "@/lib/notifications"

export function useReminders() {
  const supabase = createClient()

  const scheduleReminder = async (taskId: string | null, title: string, remindAt: Date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        task_id: taskId,
        title,
        remind_at: remindAt.toISOString(),
      })
      .select()
      .single()

    if (data) {
      // Schedule local notification
      await scheduleNotification(title, remindAt)
    }

    return data
  }

  return { scheduleReminder }
}
