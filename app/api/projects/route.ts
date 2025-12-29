import { createClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/projects/types"

const logger = createLogger("API:Projects")

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      logger.error("Failed to fetch projects", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ projects: data })
  } catch (err) {
    logger.error("Projects GET error", { error: err })
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body: CreateProjectInput = await request.json()

    if (!body.title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: PERSONAL_USER_ID,
        title: body.title,
        description: body.description,
        icon: body.icon || "📁",
        color: body.color || "#8b5cf6",
        due_date: body.due_date,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create project", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Project created", { projectId: data.id, title: data.title })
    return Response.json({ project: data }, { status: 201 })
  } catch (err) {
    logger.error("Projects POST error", { error: err })
    return Response.json({ error: "Failed to create project" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 })
    }

    const body: UpdateProjectInput = await request.json()

    const { data, error } = await supabase
      .from("projects")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", PERSONAL_USER_ID)
      .select()
      .single()

    if (error) {
      logger.error("Failed to update project", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Project updated", { projectId: data.id })
    return Response.json({ project: data })
  } catch (err) {
    logger.error("Projects PATCH error", { error: err })
    return Response.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Delete related data first
    await supabase.from("milestones").delete().eq("project_id", projectId)
    await supabase.from("project_tasks").delete().eq("project_id", projectId)

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", PERSONAL_USER_ID)

    if (error) {
      logger.error("Failed to delete project", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Project deleted", { projectId })
    return Response.json({ success: true })
  } catch (err) {
    logger.error("Projects DELETE error", { error: err })
    return Response.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
