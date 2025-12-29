import { createClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { PERSONAL_USER_ID } from "@/lib/constants"

const logger = createLogger("API:HabitsComplete")

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { habitId, notes } = await request.json()

    if (!habitId) {
      return Response.json({ error: "Habit ID is required" }, { status: 400 })
    }

    // Check if already completed today
    const today = new Date().toISOString().split("T")[0]
    const { data: existing } = await supabase
      .from("habit_completions")
      .select("id")
      .eq("habit_id", habitId)
      .eq("user_id", PERSONAL_USER_ID)
      .gte("completed_at", `${today}T00:00:00`)
      .lte("completed_at", `${today}T23:59:59`)
      .single()

    if (existing) {
      return Response.json({ error: "Already completed today" }, { status: 409 })
    }

    // Get current habit stats
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("streak_current, streak_best, total_completions")
      .eq("id", habitId)
      .eq("user_id", PERSONAL_USER_ID)
      .single()

    if (habitError) {
      logger.error("Failed to fetch habit", { error: habitError.message })
      return Response.json({ error: "Habit not found" }, { status: 404 })
    }

    // Insert completion
    const { data: completion, error: completionError } = await supabase
      .from("habit_completions")
      .insert({
        habit_id: habitId,
        user_id: PERSONAL_USER_ID,
        completed_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single()

    if (completionError) {
      logger.error("Failed to record completion", { error: completionError.message })
      return Response.json({ error: completionError.message }, { status: 500 })
    }

    // Update habit stats
    const newStreak = habit.streak_current + 1
    const { data: updatedHabit, error: updateError } = await supabase
      .from("habits")
      .update({
        streak_current: newStreak,
        streak_best: Math.max(habit.streak_best, newStreak),
        total_completions: habit.total_completions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId)
      .select()
      .single()

    if (updateError) {
      logger.error("Failed to update habit stats", { error: updateError.message })
      // Completion still recorded, so don't fail
    }

    logger.info("Habit completed", {
      habitId,
      newStreak,
      totalCompletions: habit.total_completions + 1,
    })

    return Response.json({
      completion,
      habit: updatedHabit,
      streak: newStreak,
    })
  } catch (err) {
    logger.error("Habit complete error", { error: err })
    return Response.json({ error: "Failed to complete habit" }, { status: 500 })
  }
}
