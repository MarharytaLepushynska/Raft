import { Icon } from '@/lib/icons';
import { formatDate } from '@/lib/notes';
import type { Note } from '@/types/note';
import '../task/TaskModal.css';
import './NoteViewModal.css';

interface NoteViewModalProps {
    note: Note;
    onClose: () => void;
    onEdit: () => void;
    isPersonal: boolean;
    editLabel?: string;
}

export function NoteViewModal({ note, onClose, onEdit, isPersonal, editLabel = 'Edit' }: NoteViewModalProps) {
    return (
        <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__scrim" onClick={onClose} />
            <div className="modal__card note-view-modal">
                <div className="note-view-modal__header">
                    <div className="note-view-modal__meta">
                        <span className="note-view-modal__folder">{note.folderName}</span>
                        <span className="note-view-modal__date">
                            {formatDate(note.updatedAt)}
                        </span>
                    </div>
                    <div className="note-view-modal__actions">
                        {isPersonal && <button type="button" className="note-view-modal__btn note-view-modal__btn--edit" onClick={onEdit} title={editLabel}>
                            <Icon name="edit" size={15} />
                            {editLabel}
                        </button>}
                        <button type="button" className="note-view-modal__btn note-view-modal__btn--close" onClick={onClose} aria-label="Close">
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                </div>

                <h2 className="note-view-modal__title">{note.title}</h2>
                <hr className="note-view-modal__divider" />

                <div className="note-view-modal__body">
                    {note.content ? (
                        <p className="note-view-modal__content">{note.content}</p>
                    ) : (
                        <p className="note-view-modal__empty">No content yet.</p>
                    )}
                </div>

                {!isPersonal && note.creator && (
                    <div className="note-view-modal__footer">
                        <span className="note-view-modal__creator">
                            Created by {note.creator.username}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}