import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { formatReminderTime } from '@/lib/inbox';
import type { Reminder } from '@/types/reminder';

interface ReminderRowProps {
    reminder: Reminder;
    title?: string;
    onDelete: (id: string) => void;
}

/** One reminder row with Overdue/Sent badges; tap it to reveal Delete. */
export function ReminderRow({ reminder, title, onDelete }: ReminderRowProps) {
    const [swiped, setSwiped] = useState(false);
    const overdue = new Date(reminder.reminderTime) < new Date() && !reminder.sent;
    const sent = reminder.sent;

    return (
        <div
            className={`inbox-row inbox-row--reminder${overdue ? ' inbox-row--overdue' : ''}${swiped ? ' inbox-row--swiped' : ''}`}
        >
            <div className="inbox-row__main" onClick={() => setSwiped(s => !s)}>
                <div className="inbox-row__icon-wrap inbox-row__icon-wrap--reminder">
                    <Icon name="calendar" size={18} />
                </div>
                <div className="inbox-row__body">
                    <div className="inbox-row__top">
                        <span className="inbox-row__title">
                            {title ?? (reminder.taskId ? 'Task reminder' : reminder.eventId ? 'Event reminder' : 'Reminder')}
                        </span>
                        {sent && <span className="inbox-row__badge inbox-row__badge--sent">Sent</span>}
                        {overdue && !sent && <span className="inbox-row__badge inbox-row__badge--overdue">Overdue</span>}
                    </div>
                    <p className="inbox-row__message">
                        Scheduled for{' '}
                        <time dateTime={reminder.reminderTime}>
                            {new Date(reminder.reminderTime).toLocaleString('en-GB', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                        </time>
                    </p>
                </div>
                <div className="inbox-row__meta">
                    <span className={`inbox-row__time${overdue && !sent ? ' inbox-row__time--overdue' : ''}`}>
                        {formatReminderTime(reminder.reminderTime)}
                    </span>
                </div>
            </div>

            {swiped && (
                <div className="inbox-row__actions">
                    <button
                        type="button"
                        className="inbox-row__action inbox-row__action--delete"
                        onClick={() => onDelete(reminder.id)}
                        title="Delete reminder"
                    >
                        <Icon name="trash" size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}