import type { Note } from '@/types/note';
import { mockNotes } from '@/mocks/notes';

let store: Note[] = mockNotes.map((note) => ({ ...note }));

export async function getNotes(): Promise<Note[]> {
    return Promise.resolve(store.map((note) => ({ ...note })));
}

export async function createNote(input: Omit<Note, 'id'>): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
    };
    store = [note, ...store];
    return { ...note };
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<Note> {
    const now = new Date().toISOString();
    store = store.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: now } : note,
    );
    const updated = store.find((note) => note.id === id);
    if (!updated) throw new Error(`Note ${id} not found`);
    return { ...updated };
}

export async function deleteNote(id: string): Promise<void> {
    store = store.filter((note) => note.id !== id);
}