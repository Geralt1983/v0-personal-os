import { createClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/notes/types"

const logger = createLogger("API:Notes")

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const archived = searchParams.get("archived") === "true"
    const pinned = searchParams.get("pinned") === "true"
    const search = searchParams.get("search")

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })

    if (!archived) {
      query = query.eq("archived", false)
    }

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (pinned) {
      query = query.eq("pinned", true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      logger.error("Failed to fetch notes", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ notes: data })
  } catch (err) {
    logger.error("Notes GET error", { error: err })
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body: CreateNoteInput = await request.json()

    if (!body.content) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: PERSONAL_USER_ID,
        title: body.title,
        content: body.content,
        type: body.type || "quick",
        task_id: body.task_id,
        project_id: body.project_id,
        goal_id: body.goal_id,
        tags: body.tags || [],
        pinned: body.pinned || false,
        archived: false,
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create note", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Note created", { noteId: data.id })
    return Response.json({ note: data }, { status: 201 })
  } catch (err) {
    logger.error("Notes POST error", { error: err })
    return Response.json({ error: "Failed to create note" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get("id")

    if (!noteId) {
      return Response.json({ error: "Note ID is required" }, { status: 400 })
    }

    const body: UpdateNoteInput = await request.json()

    const { data, error } = await supabase
      .from("notes")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", PERSONAL_USER_ID)
      .select()
      .single()

    if (error) {
      logger.error("Failed to update note", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Note updated", { noteId: data.id })
    return Response.json({ note: data })
  } catch (err) {
    logger.error("Notes PATCH error", { error: err })
    return Response.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get("id")

    if (!noteId) {
      return Response.json({ error: "Note ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", PERSONAL_USER_ID)

    if (error) {
      logger.error("Failed to delete note", { error: error.message })
      return Response.json({ error: error.message }, { status: 500 })
    }

    logger.info("Note deleted", { noteId })
    return Response.json({ success: true })
  } catch (err) {
    logger.error("Notes DELETE error", { error: err })
    return Response.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
