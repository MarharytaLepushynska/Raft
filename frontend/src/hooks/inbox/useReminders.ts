import {useEffect, useState} from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '@/api/reminders';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '@/types/reminder';

const now = Date.now();
const USE_MOCK = true;

const MOCK_REMINDERS: Reminder[] = [
    {
        id: 'r1',
        taskId: 'task-99',
        reminderTime: new Date(now + 2 * 3600_000).toISOString(),
        sent: false,
    },
    {
        id: 'r2',
        eventId: 'event-5',
        reminderTime: new Date(now - 30 * 60_000).toISOString(),
        sent: false,
    },
    {
        id: 'r3',
        taskId: 'task-12',
        reminderTime: new Date(now - 86400_000).toISOString(),
        sent: true,
    },
];

export function useReminders() {
    const [reminders, setReminders] = useState<Reminder[]>(USE_MOCK ? MOCK_REMINDERS : []);
    const [loading, setLoading] = useState(!USE_MOCK);

    useEffect(() => {
        if (USE_MOCK) return;
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
        if (!USE_MOCK) await deleteReminder(id);
        setReminders((prev) => prev.filter((r) => r.id !== id));
    };

    return { reminders, loading, create, update, remove };
}
