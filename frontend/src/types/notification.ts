export type NotificationType = 'REMINDER' | 'ACHIEVEMENT' | 'SYSTEM';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    sourceId?: string;
    read: boolean;
    createdAt: string;
}