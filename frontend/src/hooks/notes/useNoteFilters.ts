import { useMemo, useState } from 'react';
import type { Note } from '@/types/note';
import type { Folder, FolderType } from '@/types/folder';

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

/** Holds the notes page's search/sort/filter state and returns the filtered folders and notes (split into mine vs teammates'). */
export function useNoteFilters(notes: Note[], folders: Folder[], currentUserId: string | undefined) {
    const [noteSearch, setNoteSearch] = useState('');
    const [folderSearch, setFolderSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [folderTypeFilter, setFolderTypeFilter] = useState<FolderTypeFilter>('ALL');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());

    const toggleFolder = (id: string) =>
        setSelectedFolderId((prev) => (prev === id ? null : id));

    const filteredFolders = useMemo(() => {
        let result = folders;
        if (selectedSpaceIds.size > 0) {
            result = result.filter((f) => selectedSpaceIds.has(f.workspaceId));
        }
        const query = folderSearch.trim().toLowerCase();
        if (query) {
            result = result.filter((f) => f.name.toLowerCase().includes(query));
        }
        if (folderTypeFilter !== 'ALL') {
            result = result.filter((f) => f.folderType === folderTypeFilter);
        }
        return result;
    }, [folders, folderSearch, folderTypeFilter, selectedSpaceIds]);

    const accessibleFolderIds = useMemo(
        () => new Set(filteredFolders.map((f) => f.id)),
        [filteredFolders]
    );

    const filteredNotes = useMemo(() => {
        const query = noteSearch.trim().toLowerCase();
        const result = notes.filter((n) => {
            if (!accessibleFolderIds.has(n.folderId)) return false;
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
    }, [notes, noteSearch, selectedFolderId, sortKey, accessibleFolderIds]);

    const myNotes = useMemo(
        () => filteredNotes.filter((n) => n.creator?.id === currentUserId),
        [filteredNotes, currentUserId]
    );

    const teammateNotes = useMemo(
        () => filteredNotes.filter((n) => n.creator?.id !== currentUserId),
        [filteredNotes, currentUserId]
    );

    const selectedFolder = useMemo(
        () => folders.find((f) => f.id === selectedFolderId) ?? null,
        [folders, selectedFolderId]
    );

    const isPersonalFolderSelected = selectedFolder?.folderType === 'PERSONAL';
    const hasFolderFilter = selectedFolderId !== null;

    return {
        noteSearch,
        setNoteSearch,
        folderSearch,
        setFolderSearch,
        sortKey,
        setSortKey,
        folderTypeFilter,
        setFolderTypeFilter,
        selectedFolderId,
        toggleFolder,
        selectedSpaceIds,
        setSelectedSpaceIds,
        selectedFolder,
        filteredFolders,
        myNotes,
        teammateNotes,
        isPersonalFolderSelected,
        hasFolderFilter,
    };
}