import {Icon} from '@/lib/icons';
import {formatDate} from '@/lib/notes';
import type {Note} from '@/types/note';
import '@/pages/notes/NotesPage.css';
import type {User} from "@/types/user.ts";

interface NoteCardProps {
    note: Note;
    isPinned: boolean;
    showFolder: boolean;
    showCreator?: boolean;
    onOpen: () => void;
    onPin: () => void;
    onUnpin: () => void;
}

function CreatorBadge({user}: { user: User }) {
    const initials = user.firstName[0].toUpperCase() + user.lastName[0].toUpperCase();
    return (
        <span className="note-card__creator">
            {user.avatar ? (
                <img
                    src={user.avatar}
                    alt={user.username}
                    className="note-card__creator-avatar"
                />
            ) : (
                <span className="note-card__creator-initials">{initials}</span>
            )}
            <span className="note-card__creator-name">{user.username}</span>
        </span>
    );
}

export function NoteCard({note, isPinned, showFolder, showCreator, onOpen, onPin, onUnpin,}: NoteCardProps) {
    return (
        <div className="note-card" onClick={onOpen}>
            <div className="note-card__head">
                <span className="note-card__date">{formatDate(note.updatedAt)}</span>

                {(!showCreator &&
                    <button type="button" className="note-card__edit"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                            }}
                            aria-label="Edit note">
                        <Icon name="edit" size={14}/>
                    </button>
                )}

            </div>
            <h3 className="note-card__title">{note.title}</h3>
            <hr className="note-card__divider"/>
            {note.content && (
                <p className="note-card__content">{note.content.substring(0, 140)}</p>
            )}
            <div className="note-card__footer">
                {showCreator && (
                    <CreatorBadge user={note.creator}/>
                )}

                {showFolder && (
                    <span className="note-card__folder">{note.folder.name}</span>
                )}

                <button type="button" className={`note-card__pin-btn${isPinned ? ' note-card__pin-btn--active' : ''}`}
                        title={isPinned ? 'Unpin from board' : 'Pin to board'} onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isPinned) {
                                onUnpin();
                            } else {
                                onPin();
                            }
                        }}
                >
                    {!isPinned && <Icon name="pin" size={14}/>}
                    {isPinned && <Icon name="unpin" size={14}/>}
                </button>
            </div>
        </div>
    );
}