import type { Folder } from '@/types/folder';
import { mockFolders } from '@/mocks/folders';

let store: Folder[] = mockFolders.map((folder) => ({ ...folder }));

export async function getFolders(): Promise<Folder[]> {
    return Promise.resolve(store.map((folder) => ({ ...folder })));
}

export async function createFolder(input: Omit<Folder, 'id'>): Promise<Folder> {
    const folder: Folder = {
        ...input,
        id: crypto.randomUUID(),
        created: input.created ?? new Date().toISOString(),
    };
    store = [folder, ...store];
    return { ...folder };
}

export async function updateFolder(id: string, patch: Partial<Folder>): Promise<Folder> {
    store = store.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder));
    const updated = store.find((folder) => folder.id === id);
    if (!updated) throw new Error(`Folder ${id} not found`);
    return { ...updated };
}

export async function deleteFolder(id: string): Promise<void> {
    store = store.filter((folder) => folder.id !== id);
}