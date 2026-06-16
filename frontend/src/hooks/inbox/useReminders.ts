import {useEffect, useState} from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '@/api/reminders';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '@/types/reminder';

/** Loads all reminders with create/update/remove, and helpers to look up or set the reminder for a task or event. */
export function useReminders() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getReminders()
            .then(data => { if (active) setReminders(data); })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const create = async (input: CreateReminderInput): Promise<Reminder> => {
        const reminder = await createReminder(input);
        setReminders((prev) => [reminder, ...prev]);
        return reminder;
    };

    const update = async (id: string, input: UpdateReminderInput): Promise<Reminder> => {
        const reminder = await updateReminder(id, input);
        setReminders((prev) => prev.map((r) => (r.id === id ? reminder : r)));
        return reminder;
    };

    const remove = async (id: string): Promise<void> => {
        await deleteReminder(id);
        setReminders((prev) => prev.filter((r) => r.id !== id));
    };

    const reminderForTask = (taskId: string) => reminders.find((r) => r.taskId === taskId) ?? null;
    const reminderForEvent = (eventId: string) => reminders.find((r) => r.eventId === eventId) ?? null;

    const setTaskReminder = (taskId: string, reminderTime: string) => {
        const existing = reminderForTask(taskId);
        return existing ? update(existing.id, { reminderTime }) : create({ taskId, reminderTime });
    };
    const setEventReminder = (eventId: string, reminderTime: string) => {
        const existing = reminderForEvent(eventId);
        return existing ? update(existing.id, { reminderTime }) : create({ eventId, reminderTime });
    };

    return {
        reminders,
        loading,
        create,
        update,
        remove,
        reminderForTask,
        reminderForEvent,
        setTaskReminder,
        setEventReminder,
    };
}
