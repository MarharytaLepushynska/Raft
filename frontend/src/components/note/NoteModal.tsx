import {useState, type FormEvent} from 'react';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types/note';
import type {Folder} from '@/types/folder';
import '../task/TaskModal.css';
import './NoteModal.css';

const TITLE_MAX = 120;
const CONTENT_MAX = 10000;

interface NoteModalProps {
    note: Note | null;
    folders: Folder[];
    defaultFolderId?: string;
    onClose: () => void;
    onCreate: (input: CreateNoteInput) => Promise<void>;
    onUpdate: (id: string, input: UpdateNoteInput) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function NoteModal({note, folders, defaultFolderId, onClose, onCreate, onUpdate, onDelete,}: NoteModalProps) {
    const [title, setTitle] = useState(note?.title ?? '');
    const [content, setContent] = useState(note?.content ?? '');
    const [folderId, setFolderId] = useState(note?.folderId ?? defaultFolderId ?? folders[0]?.id ?? '');
    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!note;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle || !folderId || submitting) return;

        setSubmitting(true);
        try {
            if (note) {
                await onUpdate(note.id, { title: trimmedTitle, content: content.trim() || '' });
            } else {
                await onCreate({ title: trimmedTitle, content: content.trim() || '', folderId });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!note || !window.confirm('Delete this note?')) return;
        setSubmitting(true);
        try {
            await onDelete(note.id);
        } finally {
            setSubmitting(false);
        }
    };

    const titleLength = title.length;
    const contentLength = content.length;

    return (
        <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__scrim" onClick={onClose} />
            <form className="modal__card note-modal" onSubmit={handleSubmit}>
                <h2 className="modal__title">{!isEditing ? 'Edit note' : 'New note'}</h2>

                <label className="modal__field modal__field--full">
                    <span>Title</span>
                    <input
                        className="modal__input"
                        placeholder="Note title"
                        maxLength={TITLE_MAX}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <span className="modal__counter">{titleLength}/{TITLE_MAX}</span>
                </label>

                <label className="modal__field modal__field--full">
                    <span>Content</span>
                    <textarea
                        className="note-modal__textarea"
                        placeholder="Content (optional)"
                        maxLength={CONTENT_MAX}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                    />
                    <span className="modal__counter">{contentLength}/{CONTENT_MAX}</span>
                </label>

                {!isEditing && (
                    <div className="modal__row">
                        <label className="modal__field">
                            <span>Folder</span>
                            <select
                                className="modal__select"
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                            >
                                {folders.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}

                <div className="modal__actions">
                    {isEditing && (
                        <button
                            type="button"
                            className="modal__btn modal__btn--danger"
                            onClick={handleDelete}
                            disabled={submitting}
                        >
                            Delete
                        </button>
                    )}
                    <span className="modal__spacer" />
                    <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="modal__btn modal__btn--primary"
                        disabled={!title.trim() || !folderId || submitting}
                    >
                        {isEditing ? 'Save' : 'Add'}
                    </button>
                </div>
            </form>
        </div>
    );
}