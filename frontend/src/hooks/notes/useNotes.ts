import { useEffect, useState } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '@/api/notes.ts';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types/note.ts';

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getNotes()
            .then((data) => {
                if (active) setNotes(data);
            })
            .catch(() => {})
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const create = async (input: CreateNoteInput): Promise<Note> => {
        const note = await createNote(input);
        setNotes((prev) => [note, ...prev]);
        return note;
    };

    const update = async (id: string, input: UpdateNoteInput): Promise<Note> => {
        const note = await updateNote(id, input);
        setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
        return note;
    };

    const remove = async (id: string): Promise<void> => {
        await deleteNote(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
    };

    return { notes, loading, create, update, remove };
}