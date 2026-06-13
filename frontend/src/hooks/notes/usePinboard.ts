import { useEffect, useMemo, useRef, useState } from 'react';
import { getPins, createPin, updatePinPosition, deletePin } from '@/api/pins.ts';
import { randomBetween } from '@/lib/notes.ts';
import type {PinItem, CreatePinInput, UpdatePinPositionInput, PinType} from '@/types/pin.ts';
import type { Note } from '@/types/note.ts';

const normalizePin = (pin: PinItem): PinItem => ({
    ...pin,
    type: pin.type.toLowerCase() as PinType
});

export function usePinboard() {
    const [pins, setPins] = useState<PinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [boardHeight, setBoardHeight] = useState(400);
    const boardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;
        getPins()
            .then((data) => {
                if (active) {
                    setPins(data.map(normalizePin));
                }
            })
            .catch(() => {})
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const pinNote = async (note: Note) => {
        if (pins.some((p) => p.noteId === note.id)) return;
        const input: CreatePinInput = { noteId: note.id, x: randomBetween(4, 68), y: randomBetween(8, 52), rotate: randomBetween(-10, 10) };
        const pin = await createPin(input);
        setPins((prev) => [...prev, normalizePin(pin)]);
    };

    const unpinByNoteId = async (noteId: string) => {
        const pin = pins.find((p) => p.noteId === noteId);
        if (!pin) return;
        await deletePin(pin.id);
        setPins((prev) => prev.filter((p) => p.id !== pin.id));
    };

    const unpinItem = async (id: string) => {
        await deletePin(id);
        setPins((prev) => prev.filter((p) => p.id !== id));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const imageUrl = ev.target?.result as string;
            const input: CreatePinInput = { imageUrl, x: randomBetween(4, 60), y: randomBetween(8, 45), rotate: randomBetween(-7, 7) };
            const pin = await createPin(input);
            setPins((prev) => [...prev, normalizePin(pin)]);
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
            const x = Math.max(0, Math.min(85, ((mv.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(72, ((mv.clientY - rect.top) / rect.height) * 100));
            setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
        };

        const onUp = () => {
            setDraggingId(null);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const pin = pins.find((p) => p.id === id);
            if (pin) {
                const updateData: UpdatePinPositionInput = { x: pin.x, y: pin.y, rotate: pin.rotate };
                updatePinPosition(pin.id, updateData).catch(() => {});
            }
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = boardHeight;
        const onMove = (mv: MouseEvent) => {
            setBoardHeight(Math.max(180, Math.min(700, startHeight + (mv.clientY - startY))));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const pinnedNoteIds = useMemo(
        () => new Set(pins.filter((p) => p.noteId).map((p) => p.noteId!)),
        [pins]
    );

    return {
        pins,
        loading,
        draggingId,
        boardHeight,
        boardRef,
        fileInputRef,
        pinnedNoteIds,
        pinNote,
        unpinByNoteId,
        unpinItem,
        handleImageUpload,
        handlePinMouseDown,
        handleResizeMouseDown,
    };
}