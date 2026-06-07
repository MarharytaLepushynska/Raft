import {useState, type FormEvent} from 'react';
import type {Note} from '@/types/note';
import type {Folder} from '@/types/folder';
import type {User} from '@/types/user';
import '../task/TaskModal.css';

interface NoteModalProps {
    note: Note | null;
    folders: Folder[];
    onClose: () => void;
    onCreate: (input: Omit<Note, 'id'>) => void;
    onUpdate: (id: string, patch: Partial<Note>) => void;
    onDelete: (id: string) => void;
}

const defaultUser: User = {
    id: 'u-current',
    firstName: 'Current',
    lastName: 'User',
    email: 'current@example.com',
};

export function NoteModal({note, folders, onClose, onCreate, onUpdate, onDelete,}: NoteModalProps) {
    const [title, setTitle] = useState(note?.title ?? '');
    const [content, setContent] = useState(note?.content ?? '');
    const [folderId, setFolderId] = useState(note?.folder.id ?? folders[0]?.id ?? '');

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        if (!folderId) return;

        const selectedFolder = folders.find((f) => f.id === folderId);
        if (!selectedFolder) return;

        const now = new Date().toISOString();

        if (note) {
            onUpdate(note.id, {
                title: trimmedTitle,
                content: content.trim() || '',
                folder: selectedFolder,
                updatedAt: now,
            });
        } else {
            const newNote: Omit<Note, 'id'> = {
                title: trimmedTitle,
                content: content.trim() || '',
                folder: selectedFolder,
                creator: defaultUser,
                createdAt: now,
                updatedAt: now,
            };
            onCreate(newNote);
        }
    };

    const handleDelete = () => {
        if (note && window.confirm('Delete this note?')) {
            onDelete(note.id);
        }
    };

    return (
        <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__scrim" onClick={onClose}/>
            <form className="modal__card" onSubmit={handleSubmit}>
                <h2 className="modal__title">{note ? 'Edit note' : 'New note'}</h2>

                <input className="modal__input" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus/>

                <textarea className="modal__textarea" placeholder="Content (optional)" value={content} onChange={(e) => setContent(e.target.value)} rows={5}/>

                <div className="modal__row">
                    <label className="modal__field">
                        <span>Folder</span>
                        <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="modal__actions">
                    {note && (
                        <button type="button" className="modal__btn modal__btn--danger" onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                    <span className="modal__spacer"/>
                    <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="modal__btn modal__btn--primary" disabled={!title.trim() || !folderId}>
                        {note ? 'Save' : 'Add'}
                    </button>
                </div>
            </form>
        </div>
    );
}