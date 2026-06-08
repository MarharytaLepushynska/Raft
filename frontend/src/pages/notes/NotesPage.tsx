import {useEffect, useMemo, useRef, useState} from 'react';
import {createNote, deleteNote, getNotes, updateNote} from '@/api/notes';
import {createFolder, deleteFolder, getFolders, updateFolder} from '@/api/folders';
import {randomBetween, formatDate} from '@/lib/notes';
import {NoteCard} from '@/components/note/NoteCard';
import {NoteModal} from '@/components/note/NoteModal';
import {FolderModal} from '@/components/folder/FolderModal';
import {Icon} from '@/lib/icons';
import type {Note} from '@/types/note';
import type {Folder} from '@/types/folder';
import type {PinItem} from '@/types/pin';
import type {PinnedNote} from '@/types/note';
import './NotesPage.css';

type SortKey = 'updatedAt' | 'createdAt' | 'title';
type FolderType = 'ALL' | 'PERSONAL' | 'SHARED';

export function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    const [noteSearch, setNoteSearch] = useState('');
    const [folderSearch, setFolderSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [folderTypeFilter, setFolderTypeFilter] = useState<FolderType>('ALL');

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [modalNote, setModalNote] = useState<Note | null | undefined>(undefined);
    const [modalFolder, setModalFolder] = useState<Folder | null | undefined>(undefined);
    const [pins, setPins] = useState<PinItem[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [boardHeight, setBoardHeight] = useState(400);
    const boardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;
        Promise.all([getNotes(), getFolders()])
            .then(([notesData, foldersData]) => {
                if (active) {
                    setNotes(notesData);
                    setFolders(foldersData);
                    const pinned = (notesData as PinnedNote[]).filter((n) => n.pinned).slice(0, 4);
                    setPins(
                        pinned.map((n, i) => ({
                            id: `note-${n.id}`,
                            type: 'note' as const,
                            noteId: n.id,
                            title: n.title,
                            text: n.content,
                            x: 4 + i * 23,
                            y: 12,
                            rotate: randomBetween(-4, 4),
                        })),
                    );
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    //Note
    const createNoteHandler = async (input: Omit<Note, 'id'>) => {
        const newNote = await createNote(input);
        setNotes((prev) => [newNote, ...prev]);
        setModalNote(undefined);
    };

    const updateNoteHandler = async (id: string, patch: Partial<Note>) => {
        const updated = await updateNote(id, patch);
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        setModalNote(undefined);
    };

    const deleteNoteHandler = async (id: string) => {
        await deleteNote(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setModalNote(undefined);
    };

    //Folder
    const createFolderHandler = async (input: Omit<Folder, 'id'>) => {
        const newFolder = await createFolder(input);
        setFolders((prev) => [newFolder, ...prev]);
        setModalFolder(undefined);
    };

    const updateFolderHandler = async (id: string, patch: Partial<Folder>) => {
        const updated = await updateFolder(id, patch);
        setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
        setModalFolder(undefined);
    };

    const deleteFolderHandler = async (id: string) => {
        await deleteFolder(id);
        setFolders((prev) => prev.filter((f) => f.id !== id));
        if (selectedFolderId === id) setSelectedFolderId(null);
        setModalFolder(undefined);
    };

    //Pinboard
    const pinNote = (note: Note) => {
        if (pins.some((p) => p.noteId === note.id)) return;
        setPins((prev) => [
            ...prev,
            {
                id: `note-${note.id}`,
                type: 'note' as const,
                noteId: note.id,
                title: note.title,
                text: note.content,
                x: randomBetween(4, 68),
                y: randomBetween(8, 52),
                rotate: randomBetween(-10, 10),
            },
        ]);
    };

    const unpinByNoteId = (noteId: string) =>
        setPins((prev) => prev.filter((p) => p.noteId !== noteId));

    const unpinItem = (id: string) =>
        setPins((prev) => prev.filter((p) => p.id !== id));

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
            const img = new Image();
            img.onload = () => {
                setPins((prev) => [
                    ...prev,
                    {
                        id: `img-${Date.now()}`,
                        type: 'image' as const,
                        src,
                        x: randomBetween(4, 60),
                        y: randomBetween(8, 45),
                        rotate: randomBetween(-7, 7),
                    },
                ]);
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handlePinMouseDown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setDraggingId(id);
        const board = boardRef.current;
        if (!board) return;
        const rect = board.getBoundingClientRect();
        const onMove = (mv: MouseEvent) => {
            const x = ((mv.clientX - rect.left) / rect.width) * 100;
            const y = ((mv.clientY - rect.top) / rect.height) * 100;
            setPins((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? {...p, x: Math.max(0, Math.min(85, x)), y: Math.max(0, Math.min(72, y))}
                        : p,
                ),
            );
        };
        const onUp = () => {
            setDraggingId(null);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = boardHeight;
        const onMove = (mv: MouseEvent) => {
            const delta = mv.clientY - startY;
            setBoardHeight(Math.max(180, Math.min(700, startHeight + delta)));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const selectedFolder = useMemo(
        () => folders.find((f) => f.id === selectedFolderId) ?? null,
        [folders, selectedFolderId],
    );

    const isPersonalFilter = selectedFolder?.type === 'PERSONAL';
    const hasFolderFilter = selectedFolderId !== null;

    const filteredFolders = useMemo(() => {
        let result = folders;
        const query = folderSearch.trim().toLowerCase();
        if (query) {
            result = result.filter((f) => f.name.toLowerCase().includes(query));
        }
        if (folderTypeFilter !== 'ALL') {
            result = result.filter((f) => f.type === folderTypeFilter);
        }
        return result;
    }, [folders, folderSearch, folderTypeFilter]);

    const filteredNotes = useMemo(() => {
        let result = notes;
        const query = noteSearch.trim().toLowerCase();
        if (query) {
            result = result.filter(
                (note) =>
                    note.title.toLowerCase().includes(query) ||
                    (note.content?.toLowerCase() ?? '').includes(query),
            );
        }
        if (selectedFolderId) {
            result = result.filter((note) => note.folder.id === selectedFolderId);
        }
        return [...result].sort((a, b) => {
            if (sortKey === 'title') return a.title.localeCompare(b.title);
            return b[sortKey].localeCompare(a[sortKey]);
        });
    }, [notes, noteSearch, selectedFolderId, sortKey]);

    const personalNotes = useMemo(
        () => filteredNotes.filter((n) => n.folder.type === 'PERSONAL'),
        [filteredNotes],
    );

    const sharedNotes = useMemo(
        () => filteredNotes.filter((n) => n.folder.type === 'SHARED'),
        [filteredNotes],
    );

    const pinnedNoteIds = useMemo(
        () => new Set(pins.filter((p) => p.noteId).map((p) => p.noteId!)),
        [pins],
    );

    const SORT_OPTIONS: { value: SortKey; label: string }[] = [
        {value: 'updatedAt', label: 'Last edited'},
        {value: 'createdAt', label: 'Date created'},
        {value: 'title', label: 'Title A–Z'},
    ];

    const FOLDER_TYPES: { value: FolderType; label: string }[] = [
        {value: 'ALL', label: 'All'},
        {value: 'PERSONAL', label: 'Personal'},
        {value: 'SHARED', label: 'Shared'},
    ];

    return (
        <div className="notes">
            {/*Pinboard*/}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Pinned notes</h2>
                    <div className="pinboard-actions">
                        <button type="button" className="pinboard-action-btn" title="Upload image"
                                onClick={() => fileInputRef.current?.click()}>
                            <Icon name="plus" size={15}/>
                            Add photo
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="pinboard-file-input"
                               onChange={handleImageUpload}/>
                    </div>
                </div>

                <div className="notes-pinboard" ref={boardRef} style={{height: boardHeight}}>
                    <div className="pinboard-resize-handle" onMouseDown={handleResizeMouseDown} />
                    {pins.length === 0 && (
                        <p className="pinboard-empty">
                            Pin notes or photos here — click a note's pin icon or "Add photo"
                        </p>
                    )}
                    {pins.map((pin) => (
                        <div
                            key={pin.id}
                            className={`pin-item${pin.type === 'image' ? ' pin-item--image' : ''}${draggingId === pin.id ? ' pin-item--dragging' : ''}`}
                            style={{left: `${pin.x}%`, top: `${pin.y}%`, transform: `rotate(${pin.rotate}deg)`}}
                            onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                        >
                            <div className="pin-item__tack"/>
                            <button type="button" className="pin-item__remove" aria-label="Unpin"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => unpinItem(pin.id)}>
                                <Icon name="close" size={11}/>
                            </button>
                            {pin.type === 'image' ? (
                                <img src={pin.src} alt="pinned" className="pin-item__image" draggable={false}/>
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

            {/*Folders*/}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Folders</h2>
                </div>

                <div className="notes-filter-bar">
                    <div className="notes-filter-bar__search">
                        <Icon name="search" size={14}/>
                        <input type="search" placeholder="Search folders" value={folderSearch}
                               onChange={(e) => setFolderSearch(e.target.value)}/>
                    </div>
                    <div className="notes-chips">
                        {FOLDER_TYPES.map(({value, label}) => (
                            <button key={value} type="button" className="notes-chip"
                                    data-active={folderTypeFilter === value}
                                    onClick={() => setFolderTypeFilter(value)}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="notes__add" onClick={() => setModalFolder(null)}>
                        <Icon name="plus" size={16}/>
                        Add folder
                    </button>
                </div>

                {loading ? (
                    <p className="notes__muted">Loading folders…</p>
                ) : (
                    <div className="folder-grid">
                        {filteredFolders.map((folder) => (
                            <div key={folder.id}
                                 className={`folder-card${selectedFolderId === folder.id ? ' folder-card--active' : ''}`}
                                 onClick={() =>
                                     setSelectedFolderId((prev) => (prev === folder.id ? null : folder.id))
                                 }>
                                <button type="button" className="folder-card__edit-btn" aria-label="Edit folder"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setModalFolder(folder);
                                        }}>
                                    <Icon name="edit" size={13}/>
                                </button>
                                <div className="folder-card__body">
                                    <p className="folder-card__name">{folder.name}</p>
                                    <p className="folder-card__meta">
                                        {folder.type === 'SHARED' ? 'Shared' : 'Personal'}
                                    </p>
                                    <p className="folder-card__date">{formatDate(folder.created)}</p>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="folder-card folder-card--new"
                                onClick={() => setModalFolder(null)}>
                            <Icon name="folder-plus" size={24}/>
                            <span>New folder</span>
                        </button>
                    </div>
                )}
            </section>

            {/*Notes*/}
            <section className="notes-section">
                <div className="notes-section__head">
                    <h2 className="notes-section__title">Notes</h2>
                </div>

                <div className="notes-filter-bar">
                    <div className="notes-filter-bar__search">
                        <Icon name="search" size={14}/>
                        <input type="search" placeholder="Search notes" value={noteSearch}
                               onChange={(e) => setNoteSearch(e.target.value)}/>
                    </div>
                    <div className="notes-chips">
                        {SORT_OPTIONS.map(({value, label}) => (
                            <button key={value} type="button" className="notes-chip" data-active={sortKey === value}
                                    onClick={() => setSortKey(value)}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="notes__add" onClick={() => setModalNote(null)}>
                        <Icon name="plus" size={16}/>
                        Add note
                    </button>
                </div>

                <div className={`notes__columns${isPersonalFilter ? ' notes__columns--single' : ''}`}>
                    <div className="notes-section notes-section--flex">
                        <div className="notes-section__head">
                            <h2 className="notes-section__subtitle">My notes</h2>
                            <span className="notes-section__count">{personalNotes.length}</span>
                        </div>
                        {loading ? (
                            <p className="notes__muted">Loading…</p>
                        ) : (
                            <div className="note-grid">
                                {personalNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isPinned={pinnedNoteIds.has(note.id)}
                                        showFolder={!hasFolderFilter}
                                        onOpen={() => setModalNote(note)}
                                        onPin={() => pinNote(note)}
                                        onUnpin={() => unpinByNoteId(note.id)}
                                    />
                                ))}
                                <button type="button" className="note-card note-card--new"
                                        onClick={() => setModalNote(null)}>
                                    <Icon name="file-plus" size={28}/>
                                    <span>New note</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {!isPersonalFilter && (
                        <div className="notes-section notes-section--flex">
                            <div className="notes-section__head">
                                <h2 className="notes-section__subtitle">Teammates</h2>
                                <span className="notes-section__count">{sharedNotes.length}</span>
                            </div>
                            {loading ? (
                                <p className="notes__muted">Loading…</p>
                            ) : (
                                <div className="note-grid">
                                    {sharedNotes.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isPinned={pinnedNoteIds.has(note.id)}
                                            showFolder={!hasFolderFilter}
                                            showCreator
                                            onOpen={() => setModalNote(note)}
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

            {modalNote !== undefined && (
                <NoteModal
                    note={modalNote}
                    folders={folders}
                    onClose={() => setModalNote(undefined)}
                    onCreate={createNoteHandler}
                    onUpdate={updateNoteHandler}
                    onDelete={deleteNoteHandler}
                />
            )}
            {modalFolder !== undefined && (
                <FolderModal
                    folder={modalFolder}
                    onClose={() => setModalFolder(undefined)}
                    onCreate={createFolderHandler}
                    onUpdate={updateFolderHandler}
                    onDelete={deleteFolderHandler}
                />
            )}
        </div>
    );
}