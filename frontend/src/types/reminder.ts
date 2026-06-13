export interface Reminder {
    id: string;
    taskId?: string;
    eventId?: string;
    reminderTime: string;
    sent: boolean;
}

export interface CreateReminderInput {
    taskId?: string;
    eventId?: string;
    reminderTime: string;
}

export interface UpdateReminderInput {
    taskId?: string;
    eventId?: string;
    reminderTime?: string;
}