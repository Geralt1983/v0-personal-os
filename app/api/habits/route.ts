import { createClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type { CreateHabitInput, UpdateHabitInput } from "@/lib/habits/types"

const logger = createLogger("API:Habits")

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get("archived") === "true"

    const query = supabase
      .from("habits")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("created_at", { ascending: false })

    if (!includeArchived) {
      query.eq("archived", false)
    }

    const { data, error } = await query

    if (error) {
      logger.error("Failed to fetch habits", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ habits: data })
  } catch (err) {
    logger.error("Habits GET error", { error: err })
    return Response.json({ error: "Failed to fetch habits" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body: CreateHabitInput = await request.json()

    if (!body.title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: PERSONAL_USER_ID,
        title: body.title,
        description: body.description,
        icon: body.icon || "🎯",
        color: body.color || "#06b6d4",
        frequency: body.frequency || { type: "daily" },
        reminder_time: body.reminder_time,
        streak_current: 0,
        streak_best: 0,
        total_completions: 0,
        archived: false,
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create habit", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Habit created", { habitId: data.id, title: data.title })
    return Response.json({ habit: data }, { status: 201 })
  } catch (err) {
    logger.error("Habits POST error", { error: err })
    return Response.json({ error: "Failed to create habit" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get("id")

    if (!habitId) {
      return Response.json({ error: "Habit ID is required" }, { status: 400 })
    }

    const body: UpdateHabitInput = await request.json()

    const { data, error } = await supabase
      .from("habits")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId)
      .eq("user_id", PERSONAL_USER_ID)
      .select()
      .single()

    if (error) {
      logger.error("Failed to update habit", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Habit updated", { habitId: data.id })
    return Response.json({ habit: data })
  } catch (err) {
    logger.error("Habits PATCH error", { error: err })
    return Response.json({ error: "Failed to update habit" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get("id")

    if (!habitId) {
      return Response.json({ error: "Habit ID is required" }, { status: 400 })
    }

    // Delete completions first (foreign key constraint)
    await supabase.from("habit_completions").delete().eq("habit_id", habitId)

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", PERSONAL_USER_ID)

    if (error) {
      logger.error("Failed to delete habit", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Habit deleted", { habitId })
    return Response.json({ success: true })
  } catch (err) {
    logger.error("Habits DELETE error", { error: err })
    return Response.json({ error: "Failed to delete habit" }, { status: 500 })
  }
}
