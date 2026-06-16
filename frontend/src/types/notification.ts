export type NotificationType = 'REMINDER' | 'ACHIEVEMENT' | 'SYSTEM';

/** An inbox notification (reminder fired, achievement earned, system message…). */
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    /** Id of the related entity (e.g. the reminder/achievement), when applicable. */
    sourceId?: string;
    read: boolean;
    createdAt: string;
}