import type { Note } from './note';

export type Folder = {
  path: string;
  name: string;
  relative_path: string;
};

export type NotesWithFolders = {
  notes: Note[];
  folders: Folder[];
};
