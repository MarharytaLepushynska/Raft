import {useState, type FormEvent} from 'react';
import type {Folder, FolderType} from '@/types/folder';
import '../task/TaskModal.css';

const TYPES: FolderType[] = ['PERSONAL', 'SHARED'];

interface FolderModalProps {
    folder: Folder | null;
    onClose: () => void;
    onCreate: (input: Omit<Folder, 'id'>) => void;
    onUpdate: (id: string, patch: Partial<Folder>) => void;
    onDelete: (id: string) => void;
}

export function FolderModal({folder, onClose, onCreate, onUpdate, onDelete}: FolderModalProps) {
    const [name, setName] = useState(folder?.name ?? '');
    const [type, setType] = useState<FolderType>(folder?.type ?? 'PERSONAL');

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        const data: Omit<Folder, 'id'> = {
            name: trimmed,
            type,
            owner: folder?.owner ?? {id: '', firstName: '', lastName: '', email: ''},
            created: folder?.created ?? new Date().toISOString(),
        };
        if (folder) onUpdate(folder.id, data);
        else onCreate(data);
    };

    return (
        <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__scrim" onClick={onClose}/>
            <form className="modal__card" onSubmit={handleSubmit}>
                <h2 className="modal__title">{folder ? 'Edit folder' : 'New folder'}</h2>

                <input className="modal__input" placeholder="Folder name" value={name}
                       onChange={(e) => setName(e.target.value)}
                       autoFocus/>

                <div className="modal__row">
                    <label className="modal__field">
                        <span>Type</span>
                        <select value={type} onChange={(e) => setType(e.target.value as FolderType)}>
                            {TYPES.map((value) => (
                                <option key={value} value={value}>
                                    {value === 'PERSONAL' ? 'Personal' : 'Shared'}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="modal__actions">
                    {folder && (
                        <button type="button" className="modal__btn modal__btn--danger"
                                onClick={() => onDelete(folder.id)}>
                            Delete
                        </button>
                    )}
                    <span className="modal__spacer"/>
                    <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="modal__btn modal__btn--primary" disabled={!name.trim()}>
                        {folder ? 'Save' : 'Add'}
                    </button>
                </div>
            </form>
        </div>
    );
}