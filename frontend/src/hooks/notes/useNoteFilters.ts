import { useMemo, useState } from 'react';
import type { Note } from '@/types/note.ts';
import type { Folder, FolderType } from '@/types/folder.ts';

type SortKey = 'updatedAt' | 'createdAt' | 'title';
type FolderTypeFilter = 'ALL' | FolderType;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'updatedAt', label: 'Last edited' },
    { value: 'createdAt', label: 'Date created' },
    { value: 'title', label: 'Title A–Z' },
];

export const FOLDER_TYPE_OPTIONS: { value: FolderTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'SHARED', label: 'Shared' },
];

export function useNoteFilters(notes: Note[], folders: Folder[], currentUserId: string | undefined) {
    const [noteSearch, setNoteSearch] = useState('');
    const [folderSearch, setFolderSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [folderTypeFilter, setFolderTypeFilter] = useState<FolderTypeFilter>('ALL');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

    const toggleFolder = (id: string) =>
        setSelectedFolderId((prev) => (prev === id ? null : id));

    const selectedFolder = useMemo(
        () => folders.find((f) => f.id === selectedFolderId) ?? null,
        [folders, selectedFolderId],
    );

    const filteredFolders = useMemo(() => {
        const query = folderSearch.trim().toLowerCase();
        return folders.filter((f) => {
            const matchesSearch = !query || f.name.toLowerCase().includes(query);
            const matchesType = folderTypeFilter === 'ALL' || f.folderType === folderTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [folders, folderSearch, folderTypeFilter]);

    const filteredNotes = useMemo(() => {
        const query = noteSearch.trim().toLowerCase();
        const result = notes.filter((n) => {
            const matchesSearch =
                !query ||
                n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query);
            const matchesFolder = !selectedFolderId || n.folderId === selectedFolderId;
            return matchesSearch && matchesFolder;
        });

        return result.sort((a, b) => {
            if (sortKey === 'title') return a.title.localeCompare(b.title);
            return b[sortKey].localeCompare(a[sortKey]);
        });
    }, [notes, noteSearch, selectedFolderId, sortKey]);

    const myNotes = useMemo(
        () => filteredNotes.filter((n) => n.creator?.id === currentUserId),
        [filteredNotes, currentUserId],
    );

    const teammateNotes = useMemo(
        () => filteredNotes.filter((n) => n.creator?.id !== currentUserId),
        [filteredNotes, currentUserId],
    );

    const isPersonalFolderSelected = selectedFolder?.folderType === 'PERSONAL';

    return {
        noteSearch, setNoteSearch,
        folderSearch, setFolderSearch,
        sortKey, setSortKey,
        folderTypeFilter, setFolderTypeFilter,
        selectedFolderId, toggleFolder,
        selectedFolder,
        filteredFolders,
        myNotes,
        teammateNotes,
        isPersonalFolderSelected,
        hasFolderFilter: selectedFolderId !== null,
    };
}