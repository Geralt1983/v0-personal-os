/**
 * Notes Store
 *
 * Zustand store for quick capture notes.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NoteWithLinks, NoteType } from "@/lib/notes/types"

interface NotesState {
  // Data
  notes: NoteWithLinks[]
  loading: boolean
  error: string | null

  // UI State
  selectedNoteId: string | null
  typeFilter: NoteType | "all"
  showArchived: boolean
  showPinnedOnly: boolean
  searchQuery: string

  // Actions
  setNotes: (notes: NoteWithLinks[]) => void
  addNote: (note: NoteWithLinks) => void
  updateNote: (id: string, updates: Partial<NoteWithLinks>) => void
  removeNote: (id: string) => void
  togglePin: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedNote: (id: string | null) => void
  setTypeFilter: (type: NoteType | "all") => void
  toggleShowArchived: () => void
  toggleShowPinnedOnly: () => void
  setSearchQuery: (query: string) => void
  reset: () => void
}

const initialState = {
  notes: [],
  loading: false,
  error: null,
  selectedNoteId: null,
  typeFilter: "all" as const,
  showArchived: false,
  showPinnedOnly: false,
  searchQuery: "",
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      ...initialState,

      setNotes: (notes) => set({ notes, loading: false }),

      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
        })),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n
          ),
        })),

      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        })),

      togglePin: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n
          ),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setSelectedNote: (id) => set({ selectedNoteId: id }),

      setTypeFilter: (type) => set({ typeFilter: type }),

      toggleShowArchived: () =>
        set((state) => ({ showArchived: !state.showArchived })),

      toggleShowPinnedOnly: () =>
        set((state) => ({ showPinnedOnly: !state.showPinnedOnly })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      reset: () => set(initialState),
    }),
    {
      name: "lifeos-notes-store",
      partialize: (state) => ({
        typeFilter: state.typeFilter,
        showArchived: state.showArchived,
        showPinnedOnly: state.showPinnedOnly,
      }),
    }
  )
)
