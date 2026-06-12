import { useEffect, useState } from 'react';
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders.ts';
import type { Folder, CreateFolderInput, UpdateFolderInput } from '@/types/folder.ts';

export function useFolders() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getFolders()
            .then((data) => {
                if (active) setFolders(data);
            })
            .catch(() => {})
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const create = async (input: CreateFolderInput): Promise<Folder> => {
        const folder = await createFolder(input);
        setFolders((prev) => [folder, ...prev]);
        return folder;
    };

    const update = async (id: string, input: UpdateFolderInput): Promise<Folder> => {
        const folder = await updateFolder(id, input);
        setFolders((prev) => prev.map((f) => (f.id === id ? folder : f)));
        return folder;
    };

    const remove = async (id: string): Promise<void> => {
        await deleteFolder(id);
        setFolders((prev) => prev.filter((f) => f.id !== id));
    };

    return { folders, loading, create, update, remove };
}