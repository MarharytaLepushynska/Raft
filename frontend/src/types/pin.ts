export type PinType = 'note' | 'image';

/** An item pinned to the board, with its position (`x`/`y`) and tilt (`rotate`, degrees). */
export interface PinItem {
    id: string;
    type: PinType;
    noteId?: string;
    imageUrl?: string;
    title?: string;
    text?: string;
    x: number;
    y: number;
    rotate: number;
}

/** Payload to pin either an existing note or an image. */
export type CreatePinInput =
    | { noteId: string; x: number; y: number; rotate: number }
    | { imageUrl: string; title?: string; text?: string; x: number; y: number; rotate: number };

/** Payload to reposition a pin after dragging. */
export type UpdatePinPositionInput = { x: number; y: number; rotate: number };