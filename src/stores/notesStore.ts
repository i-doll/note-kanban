import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types/note';
import type { NotesWithFolders } from '../types/folder';
import { useFolderStore } from './folderStore';

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;

  loadNotes: (notesDir: string) => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (input: UpdateNoteInput) => Promise<void>;
  deleteNote: (filePath: string) => Promise<void>;
  moveNote: (filePath: string, targetFolder: string) => Promise<void>;
  setActiveNote: (id: string | null) => void;
  getActiveNote: () => Note | undefined;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  isLoading: false,
  error: null,

  loadNotes: async (notesDir: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<NotesWithFolders>('list_notes', { notesDir });
      set({ notes: result.notes, isLoading: false });
      useFolderStore.getState().setFolders(result.folders);
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNote: async (input: CreateNoteInput) => {
    const note = await invoke<Note>('create_note', { input });
    set(state => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (input: UpdateNoteInput) => {
    const updatedNote = await invoke<Note>('update_note', { input });
    set(state => ({
      notes: state.notes.map(n =>
        n.frontmatter.id === updatedNote.frontmatter.id ? updatedNote : n
      ),
    }));
  },

  deleteNote: async (filePath: string) => {
    await invoke('delete_note', { filePath });
    set(state => ({
      notes: state.notes.filter(n => n.file_path !== filePath),
      activeNoteId: state.notes.find(n => n.file_path === filePath)?.frontmatter.id === state.activeNoteId
        ? null
        : state.activeNoteId,
    }));
  },

  moveNote: async (filePath: string, targetFolder: string) => {
    const movedNote = await invoke<Note>('move_note', { filePath, targetFolder });
    set(state => ({
      notes: state.notes.map(n =>
        n.file_path === filePath ? movedNote : n
      ),
    }));
  },

  setActiveNote: (id: string | null) => set({ activeNoteId: id }),

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find(n => n.frontmatter.id === activeNoteId);
  },
}));
