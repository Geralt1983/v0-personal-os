"use client"

import { useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotesStore } from "@/lib/stores/notes-store"
import { PERSONAL_USER_ID } from "@/lib/constants"
import type {
  Note,
  NoteWithLinks,
  CreateNoteInput,
  UpdateNoteInput,
} from "@/lib/notes/types"

export function useNotes() {
  const supabase = createClient()
  const {
    notes,
    loading,
    error,
    selectedNoteId,
    typeFilter,
    showArchived,
    showPinnedOnly,
    searchQuery,
    setNotes,
    addNote,
    updateNote: updateNoteInStore,
    removeNote,
    togglePin: togglePinInStore,
    setLoading,
    setError,
    setSelectedNote,
    setTypeFilter,
    toggleShowArchived,
    toggleShowPinnedOnly,
    setSearchQuery,
  } = useNotesStore()

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch notes with filters
      let query = supabase
        .from("notes")
        .select("*")
        .eq("user_id", PERSONAL_USER_ID)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false })

      if (!showArchived) {
        query = query.eq("archived", false)
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter)
      }

      if (showPinnedOnly) {
        query = query.eq("pinned", true)
      }

      const { data: notesData, error: notesError } = await query

      if (notesError) throw notesError

      // Fetch linked items
      const taskIds = (notesData || []).filter((n: Note) => n.task_id).map((n: Note) => n.task_id)
      const projectIds = (notesData || []).filter((n: Note) => n.project_id).map((n: Note) => n.project_id)
      const goalIds = (notesData || []).filter((n: Note) => n.goal_id).map((n: Note) => n.goal_id)

      const [tasksResult, projectsResult, goalsResult] = await Promise.all([
        taskIds.length > 0
          ? supabase.from("tasks").select("id, title, completed").in("id", taskIds)
          : { data: [] },
        projectIds.length > 0
          ? supabase.from("projects").select("id, title, status").in("id", projectIds)
          : { data: [] },
        goalIds.length > 0
          ? supabase.from("goals").select("id, title").in("id", goalIds)
          : { data: [] },
      ])

      const tasksMap = new Map(
        (tasksResult.data || []).map((t: { id: string; title: string; completed: boolean }) => [t.id, t])
      )
      const projectsMap = new Map(
        (projectsResult.data || []).map((p: { id: string; title: string; status: string }) => [p.id, p])
      )
      const goalsMap = new Map(
        (goalsResult.data || []).map((g: { id: string; title: string }) => [g.id, { ...g, progress: 0 }])
      )

      // Combine data
      const notesWithLinks: NoteWithLinks[] = (notesData || []).map((note: Note) => ({
        ...note,
        linkedTask: note.task_id ? tasksMap.get(note.task_id) : undefined,
        linkedProject: note.project_id ? projectsMap.get(note.project_id) : undefined,
        linkedGoal: note.goal_id ? goalsMap.get(note.goal_id) : undefined,
      }))

      setNotes(notesWithLinks)
    } catch (err) {
      console.error("[LifeOS] Failed to fetch notes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch notes")
    }
  }, [supabase, typeFilter, showArchived, showPinnedOnly, setNotes, setLoading, setError])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Filtered notes based on search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes

    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [notes, searchQuery])

  const createNote = useCallback(
    async (input: CreateNoteInput) => {
      try {
        const { data, error } = await supabase
          .from("notes")
          .insert({
            user_id: PERSONAL_USER_ID,
            title: input.title,
            content: input.content,
            type: input.type || "quick",
            task_id: input.task_id,
            project_id: input.project_id,
            goal_id: input.goal_id,
            tags: input.tags || [],
            pinned: input.pinned || false,
            archived: false,
          })
          .select()
          .single()

        if (error) throw error

        const newNote: NoteWithLinks = {
          ...data,
          linkedTask: undefined,
          linkedProject: undefined,
          linkedGoal: undefined,
        }

        addNote(newNote)
        return newNote
      } catch (err) {
        console.error("[LifeOS] Failed to create note:", err)
        setError(err instanceof Error ? err.message : "Failed to create note")
        return null
      }
    },
    [supabase, addNote, setError]
  )

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput) => {
      try {
        const { data, error } = await supabase
          .from("notes")
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        updateNoteInStore(id, data)
        return data
      } catch (err) {
        console.error("[LifeOS] Failed to update note:", err)
        setError(err instanceof Error ? err.message : "Failed to update note")
        return null
      }
    },
    [supabase, updateNoteInStore, setError]
  )

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("notes").delete().eq("id", id)

        if (error) throw error

        removeNote(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to delete note:", err)
        setError(err instanceof Error ? err.message : "Failed to delete note")
        return false
      }
    },
    [supabase, removeNote, setError]
  )

  const archiveNote = useCallback(
    async (id: string) => {
      return updateNote(id, { archived: true })
    },
    [updateNote]
  )

  const togglePin = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id)
      if (!note) return false

      try {
        const { error } = await supabase
          .from("notes")
          .update({ pinned: !note.pinned })
          .eq("id", id)

        if (error) throw error

        togglePinInStore(id)
        return true
      } catch (err) {
        console.error("[LifeOS] Failed to toggle pin:", err)
        setError(err instanceof Error ? err.message : "Failed to toggle pin")
        return false
      }
    },
    [supabase, notes, togglePinInStore, setError]
  )

  const linkToTask = useCallback(
    async (noteId: string, taskId: string | null) => {
      return updateNote(noteId, { task_id: taskId })
    },
    [updateNote]
  )

  const linkToProject = useCallback(
    async (noteId: string, projectId: string | null) => {
      return updateNote(noteId, { project_id: projectId })
    },
    [updateNote]
  )

  const linkToGoal = useCallback(
    async (noteId: string, goalId: string | null) => {
      return updateNote(noteId, { goal_id: goalId })
    },
    [updateNote]
  )

  // Quick capture - creates a note from text input
  const quickCapture = useCallback(
    async (content: string, type: "quick" | "idea" = "quick") => {
      // Auto-detect if it might be a task
      const isTask = /^(todo|task|do|remind|need to|have to|must|should)/i.test(content.trim())

      return createNote({
        content,
        type: isTask ? "task" : type,
        title: content.length > 50 ? content.substring(0, 47) + "..." : undefined,
      })
    },
    [createNote]
  )

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null

  return {
    notes: filteredNotes,
    allNotes: notes,
    selectedNote,
    loading,
    error,
    typeFilter,
    showArchived,
    showPinnedOnly,
    searchQuery,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    togglePin,
    linkToTask,
    linkToProject,
    linkToGoal,
    quickCapture,
    setSelectedNote,
    setTypeFilter,
    toggleShowArchived,
    toggleShowPinnedOnly,
    setSearchQuery,
    refetch: fetchNotes,
  }
}
