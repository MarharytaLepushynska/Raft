export interface PinItem {
    id: string;
    type: 'note' | 'image';
    noteId?: string;
    title?: string;
    text?: string;
    src?: string;
    x: number;
    y: number;
    rotate: number;
}