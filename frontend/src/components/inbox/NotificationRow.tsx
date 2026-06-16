import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { formatDate, typeLabel, getNotificationIcon } from '@/lib/inbox';
import type { Notification } from '@/types/notification';

interface NotificationRowProps {
    notification: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}

/** One inbox notification row; tap it to reveal the Read/Delete actions. */
export function NotificationRow({ notification, onRead, onDelete }: NotificationRowProps) {
    const [swiped, setSwiped] = useState(false);

    return (
        <div
            className={`inbox-row${!notification.read ? ' inbox-row--unread' : ''}${swiped ? ' inbox-row--swiped' : ''}`}
        >
            <div className="inbox-row__main" onClick={() => setSwiped(s => !s)}>
                <div className={`inbox-row__icon-wrap inbox-row__icon-wrap--${notification.type.toLowerCase()}`}>
                    <Icon name={getNotificationIcon(notification.type)} size={18} />
                </div>
                <div className="inbox-row__body">
                    <div className="inbox-row__top">
                        <span className="inbox-row__title">{notification.title}</span>
                        <span className="inbox-row__badge inbox-row__badge--type">
                            {typeLabel(notification.type)}
                        </span>
                    </div>
                    <p className="inbox-row__message">{notification.message}</p>
                </div>
                <div className="inbox-row__meta">
                    <span className="inbox-row__time">{formatDate(notification.createdAt)}</span>
                    {!notification.read && <span className="inbox-row__dot" aria-label="unread" />}
                </div>
            </div>

            {swiped && (
                <div className="inbox-row__actions">
                    {!notification.read && (
                        <button
                            type="button"
                            className="inbox-row__action inbox-row__action--read"
                            onClick={() => { onRead(notification.id); setSwiped(false); }}
                            title="Mark as read"
                        >
                            <Icon name="check" size={16} />
                            <span>Read</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="inbox-row__action inbox-row__action--delete"
                        onClick={() => onDelete(notification.id)}
                        title="Delete"
                    >
                        <Icon name="trash" size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}