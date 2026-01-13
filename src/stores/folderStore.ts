import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Folder } from '../types/folder';

interface FolderState {
  folders: Folder[];
  expandedFolders: Set<string>;
  selectedFolder: string | null;

  setFolders: (folders: Folder[]) => void;
  toggleFolder: (relativePath: string) => void;
  expandFolder: (relativePath: string) => void;
  collapseFolder: (relativePath: string) => void;
  selectFolder: (relativePath: string | null) => void;

  createFolder: (
    notesDir: string,
    name: string,
    parentPath?: string
  ) => Promise<Folder>;
  renameFolder: (path: string, newName: string) => Promise<Folder>;
  deleteFolder: (path: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  expandedFolders: new Set<string>(),
  selectedFolder: null,

  setFolders: (folders) => set({ folders }),

  toggleFolder: (relativePath) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      if (expanded.has(relativePath)) {
        expanded.delete(relativePath);
      } else {
        expanded.add(relativePath);
      }
      return { expandedFolders: expanded };
    }),

  expandFolder: (relativePath) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      expanded.add(relativePath);
      return { expandedFolders: expanded };
    }),

  collapseFolder: (relativePath) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      expanded.delete(relativePath);
      return { expandedFolders: expanded };
    }),

  selectFolder: (relativePath) => set({ selectedFolder: relativePath }),

  createFolder: async (notesDir, name, parentPath) => {
    const folder = await invoke<Folder>('create_folder', {
      notesDir,
      folderName: name,
      parentPath,
    });
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  renameFolder: async (path, newName) => {
    const folder = await invoke<Folder>('rename_folder', {
      oldPath: path,
      newName,
    });
    set((state) => ({
      folders: state.folders.map((f) => (f.path === path ? folder : f)),
    }));
    return folder;
  },

  deleteFolder: async (path) => {
    await invoke('delete_folder', { folderPath: path });
    set((state) => ({
      folders: state.folders.filter((f) => !f.path.startsWith(path)),
    }));
  },
}));
