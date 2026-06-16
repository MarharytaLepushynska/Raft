/** A reminder for a task or event (exactly one of `taskId`/`eventId` is set). */
export interface Reminder {
    id: string;
    taskId?: string;
    eventId?: string;
    /** When to fire, as a local `YYYY-MM-DDTHH:mm` string. */
    reminderTime: string;
    /** True once the scheduler has sent the notification. */
    sent: boolean;
}

/** Payload to create a reminder (attach to a task or an event). */
export interface CreateReminderInput {
    taskId?: string;
    eventId?: string;
    reminderTime: string;
}

/** Payload to update a reminder (e.g. reschedule its time). */
export interface UpdateReminderInput {
    taskId?: string;
    eventId?: string;
    reminderTime?: string;
}