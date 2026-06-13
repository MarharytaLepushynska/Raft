import { api } from './http';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '@/types/reminder';

export async function getReminders(): Promise<Reminder[]> {
    return api.get<Reminder[]>('/reminders');
}

export async function createReminder(data: CreateReminderInput): Promise<Reminder> {
    return api.post<Reminder>('/reminders', data);
}

export async function updateReminder(id: string, data: UpdateReminderInput): Promise<Reminder> {
    return api.patch<Reminder>(`/reminders/${id}`, data);
}

export async function deleteReminder(id: string): Promise<void> {
    return api.delete<void>(`/reminders/${id}`);
}