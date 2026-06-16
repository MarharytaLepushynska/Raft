import { useEffect, useMemo, useRef, useState } from 'react';
import { getPins, createPin, updatePinPosition, deletePin } from '@/api/pins.ts';
import { randomBetween } from '@/lib/notes.ts';
import type {PinItem, CreatePinInput, PinType} from '@/types/pin.ts';
import type { Note } from '@/types/note.ts';

const normalizePin = (pin: PinItem): PinItem => ({
    ...pin,
    type: pin.type.toLowerCase() as PinType
});

/** Runs the pinboard: loads pins, lets you pin notes or images, and handles dragging and resizing. */
export function usePinboard() {
    const [pins, setPins] = useState<PinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [boardHeight, setBoardHeight] = useState(400);
    const boardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragPositionRef = useRef<{ x: number; y: number } | null>(null);

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
        const { x, y } = getRandomPosition();
        const input: CreatePinInput = { noteId: note.id, x, y, rotate: randomBetween(-10, 10) };
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

    const getRandomPosition = () => {
        const board = boardRef.current;
        if (!board) return { x: randomBetween(10, 60), y: randomBetween(10, 60) };
        const PADDING = 40;
        const PIN_SIZE = 100;
        const maxX = board.clientWidth - PIN_SIZE - PADDING;
        const maxY = board.clientHeight - PIN_SIZE - PADDING;
        const x = (randomBetween(PADDING, Math.max(PADDING, maxX)) / board.clientWidth) * 100;
        const y = (randomBetween(PADDING, Math.max(PADDING, maxY)) / board.clientHeight) * 100;
        return { x, y };
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const imageUrl = ev.target?.result as string;
            const { x, y } = getRandomPosition();
            const input: CreatePinInput = { imageUrl, x, y, rotate: randomBetween(-7, 7) };
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
            const y = Math.max(0, Math.min(88, ((mv.clientY - rect.top) / rect.height) * 100));            dragPositionRef.current = { x, y };
            setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
        };

        const onUp = () => {
            setDraggingId(null);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const pos = dragPositionRef.current;
            if (pos) {
                setPins((prev) => {
                    const pin = prev.find((p) => p.id === id);
                    if (pin) {
                        updatePinPosition(pin.id, { x: pos.x, y: pos.y, rotate: pin.rotate })
                            .catch(() => {});
                    }
                    return prev;
                });
                dragPositionRef.current = null;
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

    const removePinByNoteId = (noteId: string) => {
        setPins((prev) => prev.filter((p) => p.noteId !== noteId));
    };

    const updatePinByNote = (note: Note) => {
        setPins((prev) => prev.map((p) =>
            p.noteId === note.id
                ? { ...p, title: note.title, text: note.content }
                : p
        ));
    };

    const removePinsByNoteIds = (noteIds: string[]) => {
        const noteIdSet = new Set(noteIds);
        setPins((prev) => prev.filter((p) => !p.noteId || !noteIdSet.has(p.noteId)));
    };

    return {
        pins,
        loading,
        draggingId,
        boardHeight,
        boardRef,
        fileInputRef,
        pinnedNoteIds,
        removePinByNoteId,
        updatePinByNote,
        removePinsByNoteIds,
        pinNote,
        unpinByNoteId,
        unpinItem,
        handleImageUpload,
        handlePinMouseDown,
        handleResizeMouseDown,
    };
}