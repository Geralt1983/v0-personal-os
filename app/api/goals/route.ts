import { createClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/goals/types"

const logger = createLogger("API:Goals")

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const timeframe = searchParams.get("timeframe")

    let query = supabase
      .from("goals")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (timeframe && timeframe !== "all") {
      query = query.eq("timeframe", timeframe)
    }

    const { data, error } = await query

    if (error) {
      logger.error("Failed to fetch goals", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ goals: data })
  } catch (err) {
    logger.error("Goals GET error", { error: err })
    return Response.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body: CreateGoalInput = await request.json()

    if (!body.title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    if (!body.timeframe) {
      return Response.json({ error: "Timeframe is required" }, { status: 400 })
    }

    // Calculate dates based on timeframe
    const { startDate, endDate } = calculateDates(body.timeframe, body.start_date, body.end_date)

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: PERSONAL_USER_ID,
        title: body.title,
        description: body.description,
        icon: body.icon || "🎯",
        color: body.color || "#f59e0b",
        timeframe: body.timeframe,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        project_id: body.project_id,
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create goal", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Goal created", { goalId: data.id, title: data.title })
    return Response.json({ goal: data }, { status: 201 })
  } catch (err) {
    logger.error("Goals POST error", { error: err })
    return Response.json({ error: "Failed to create goal" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get("id")

    if (!goalId) {
      return Response.json({ error: "Goal ID is required" }, { status: 400 })
    }

    const body: UpdateGoalInput = await request.json()

    const { data, error } = await supabase
      .from("goals")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", PERSONAL_USER_ID)
      .select()
      .single()

    if (error) {
      logger.error("Failed to update goal", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Goal updated", { goalId: data.id })
    return Response.json({ goal: data })
  } catch (err) {
    logger.error("Goals PATCH error", { error: err })
    return Response.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get("id")

    if (!goalId) {
      return Response.json({ error: "Goal ID is required" }, { status: 400 })
    }

    // Delete related data first
    await supabase.from("key_results").delete().eq("goal_id", goalId)
    await supabase.from("goal_check_ins").delete().eq("goal_id", goalId)

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", PERSONAL_USER_ID)

    if (error) {
      logger.error("Failed to delete goal", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Goal deleted", { goalId })
    return Response.json({ success: true })
  } catch (err) {
    logger.error("Goals DELETE error", { error: err })
    return Response.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}

function calculateDates(
  timeframe: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date()

  if (customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd }
  }

  let startDate: Date
  let endDate: Date

  switch (timeframe) {
    case "weekly":
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      break

    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    case "quarterly":
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      break

    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
      break

    default:
      startDate = now
      endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 3)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}
