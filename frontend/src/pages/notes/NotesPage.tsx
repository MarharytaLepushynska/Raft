import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useWorkspaces } from '@/hooks/workspaces/useWorkspaces';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { useNotes } from '@/hooks/notes/useNotes';
import { useFolders } from '@/hooks/notes/useFolders';
import { usePinboard } from '@/hooks/notes/usePinboard';
import { useNoteFilters, SORT_OPTIONS, FOLDER_TYPE_OPTIONS } from '@/hooks/notes/useNoteFilters';
import { Icon } from '@/lib/icons';
import { formatDate } from '@/lib/notes';
import { NoteCard } from '@/components/note/NoteCard';
import { NoteModal } from '@/components/note/NoteModal';
import { NoteViewModal } from '@/components/note/NoteViewModal';
import { FolderModal } from '@/components/folder/FolderModal';
import type { Note } from '@/types/note';
import type { Folder } from '@/types/folder';
import './NotesPage.css';

type NoteModalState = { note: Note | null; defaultFolderId?: string } | null;
type FolderModalState = { folder: Folder | null } | null;

export function NotesPage() {
    const { user, loading: authLoading } = useAuth();
    const { workspaces, spaceOptions } = useWorkspaces();

    const { notes, loading: notesLoading, create: createNote, update: updateNote, remove: removeNote } = useNotes();
    const { folders, loading: foldersLoading, create: createFolder, update: updateFolder, remove: removeFolder } = useFolders();
    const {
        pins,
        loading: pinboardLoading,
        draggingId,
        boardHeight,
        boardRef,
        fileInputRef,
        pinnedNoteIds,
        removePinByNoteId,
        pinNote,
        unpinByNoteId,
        unpinItem,
        handleImageUpload,
        handlePinMouseDown,
        handleResizeMouseDown,
    } = usePinboard();
    const filters = useNoteFilters(notes, folders, user?.id);

    const [noteModal, setNoteModal] = useState<NoteModalState>(null);
    const [viewNote, setViewNote] = useState<Note | null>(null);
    const [folderModal, setFolderModal] = useState<FolderModalState>(null);

    const loading = notesLoading || foldersLoading || pinboardLoading;

    const hasWorkspaces = workspaces.length > 0;

    const openNewNote = (folderId?: string) =>
        setNoteModal({ note: null, defaultFolderId: folderId ?? filters.selectedFolderId ?? undefined });

    const openEditNote = (note: Note) => setNoteModal({ note });

    const handleViewEdit = () => {
        if (!viewNote) return;
        setViewNote(null);
        openEditNote(viewNote);
    };

    if (authLoading) return <div className="notes">Loading…</div>;
    if (!user) return <div className="notes">Please log in to see your notes.</div>;

    if (!hasWorkspaces && folders.length === 0) {
        console.warn('No workspace available to create folders');
    }

    return (
        <div className="notes">
            {/* Pinboard */}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Pinned notes</h2>
                    <div className="pinboard-actions">
                        <button
                            type="button"
                            className="pinboard-action-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Icon name="plus" size={15} />
                            Add photo
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="pinboard-file-input"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>
                <div className="notes-pinboard" ref={boardRef} style={{ height: boardHeight }}>
                    <div className="pinboard-resize-handle" onMouseDown={handleResizeMouseDown} />
                    {pins.length === 0 && (
                        <p className="pinboard-empty">
                            Pin notes or photos here — click a note's pin icon or "Add photo"
                        </p>
                    )}
                    {pins.map((pin) => (
                        <div
                            key={pin.id}
                            className={`pin-item ${pin.type === 'image' ? 'pin-item--image' : ''} ${draggingId === pin.id ? 'pin-item--dragging' : ''}`}
                            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: `rotate(${pin.rotate}deg)` }}
                            onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                        >
                            <div className="pin-item__tack" />
                            <button
                                type="button"
                                className="pin-item__remove"
                                aria-label="Unpin"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => unpinItem(pin.id)}
                            >
                                <Icon name="close" size={11} />
                            </button>
                            {pin.type === 'image' ? (
                                <img src={pin.imageUrl} alt="pinned" className="pin-item__image" draggable={false} />
                            ) : (
                                <>
                                    {pin.title && <p className="pin-item__title">{pin.title}</p>}
                                    {pin.text && <p className="pin-item__text">{pin.text}</p>}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Folders */}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Folders</h2>
                </div>
                <div className="notes-filter-bar">
                    <div className="notes-filter-bar__search">
                        <Icon name="search" size={14} />
                        <input
                            type="search"
                            placeholder="Search folders"
                            value={filters.folderSearch}
                            onChange={(e) => filters.setFolderSearch(e.target.value)}
                        />
                    </div>
                    {spaceOptions.length > 0 && (
                        <MultiSelectFilter
                            options={spaceOptions}
                            selected={filters.selectedSpaceIds}
                            onChange={filters.setSelectedSpaceIds}
                            allLabel="All spaces"
                            countNoun="spaces"
                            icon="spaces"
                        />
                    )}
                    <div className="notes-chips">
                        {FOLDER_TYPE_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                className="notes-chip"
                                data-active={filters.folderTypeFilter === value}
                                onClick={() => filters.setFolderTypeFilter(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="notes__add"
                        onClick={() => setFolderModal({ folder: null })}
                        disabled={!hasWorkspaces}
                    >
                        <Icon name="plus" size={16} />
                        Add folder
                    </button>
                </div>
                {foldersLoading ? (
                    <p className="notes__muted">Loading folders…</p>
                ) : (
                    <div className="folder-grid">
                        {filters.filteredFolders.map((folder) => (
                            <div
                                key={folder.id}
                                className={`folder-card${filters.selectedFolderId === folder.id ? ' folder-card--active' : ''}`}
                                onClick={() => filters.toggleFolder(folder.id)}
                            >
                                <button
                                    type="button"
                                    className="folder-card__edit-btn"
                                    aria-label="Edit folder"
                                    onClick={(e) => { e.stopPropagation(); setFolderModal({ folder }); }}
                                >
                                    <Icon name="edit" size={13} />
                                </button>
                                <div className="folder-card__body">
                                    <p className="folder-card__name">{folder.name}</p>
                                    <p className="folder-card__meta">
                                        {folder.workspaceName} · {folder.folderType === 'SHARED' ? 'Shared' : 'Personal'}
                                    </p>
                                    <p className="folder-card__date">{formatDate(folder.created)}</p>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="folder-card folder-card--new"
                            onClick={() => setFolderModal({ folder: null })}
                            disabled={!hasWorkspaces}
                        >
                            <Icon name="folder-plus" size={24} />
                            <span>New folder</span>
                        </button>
                    </div>
                )}
            </section>

            {/* Notes */}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Notes</h2>
                </div>
                <div className="notes-filter-bar">
                    <div className="notes-filter-bar__search">
                        <Icon name="search" size={14} />
                        <input
                            type="search"
                            placeholder="Search notes"
                            value={filters.noteSearch}
                            onChange={(e) => filters.setNoteSearch(e.target.value)}
                        />
                    </div>
                    <div className="notes-chips">
                        {SORT_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                className="notes-chip"
                                data-active={filters.sortKey === value}
                                onClick={() => filters.setSortKey(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="notes__add" onClick={() => openNewNote()}>
                        <Icon name="plus" size={16} />
                        Add note
                    </button>
                </div>

                <div className={`notes__columns${filters.isPersonalFolderSelected ? ' notes__columns--single' : ''}`}>
                    {/* My notes */}
                    <div className="notes-section notes-section--flex">
                        <div className="notes-section__head">
                            <h2 className="notes-section__subtitle">My notes</h2>
                            <span className="notes-section__count">{filters.myNotes.length}</span>
                        </div>
                        {loading ? (
                            <p className="notes__muted">Loading…</p>
                        ) : (
                            <div className="note-grid">
                                {filters.myNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isPinned={pinnedNoteIds.has(note.id)}
                                        showFolder={!filters.hasFolderFilter}
                                        onView={() => setViewNote(note)}
                                        onEdit={() => openEditNote(note)}
                                        onPin={() => pinNote(note)}
                                        onUnpin={() => unpinByNoteId(note.id)}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="note-card note-card--new"
                                    onClick={() => openNewNote()}
                                >
                                    <Icon name="file-plus" size={28} />
                                    <span>New note</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Teammates */}
                    {!filters.isPersonalFolderSelected && (
                        <div className="notes-section notes-section--flex">
                            <div className="notes-section__head">
                                <h2 className="notes-section__subtitle">Teammates</h2>
                                <span className="notes-section__count">{filters.teammateNotes.length}</span>
                            </div>
                            {loading ? (
                                <p className="notes__muted">Loading…</p>
                            ) : (
                                <div className="note-grid">
                                    {filters.teammateNotes.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isPinned={pinnedNoteIds.has(note.id)}
                                            showFolder={!filters.hasFolderFilter}
                                            showCreator
                                            onView={() => setViewNote(note)}
                                            onEdit={() => openEditNote(note)}
                                            onPin={() => pinNote(note)}
                                            onUnpin={() => unpinByNoteId(note.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Modals */}
            {viewNote && (
                <NoteViewModal
                    isPersonal={true}
                    note={viewNote}
                    onClose={() => setViewNote(null)}
                    onEdit={handleViewEdit}
                />
            )}

            {noteModal !== null && (
                <NoteModal
                    note={noteModal.note}
                    folders={folders}
                    defaultFolderId={noteModal.defaultFolderId}
                    onClose={() => setNoteModal(null)}
                    onCreate={async (input) => { await createNote(input); setNoteModal(null); }}
                    onUpdate={async (id, input) => { await updateNote(id, input); setNoteModal(null); }}
                    onDelete={async (id) => { await removeNote(id); removePinByNoteId(id); setNoteModal(null); }}
                />
            )}

            {folderModal !== null && (
                <FolderModal
                    folder={folderModal.folder}
                    workspaces={workspaces}
                    onClose={() => setFolderModal(null)}
                    onCreate={async (input) => { await createFolder(input); setFolderModal(null); }}
                    onUpdate={async (id, input) => { await updateFolder(id, input); setFolderModal(null); }}
                    onDelete={async (id) => { await removeFolder(id); setFolderModal(null); }}
                />
            )}
        </div>
    );
}