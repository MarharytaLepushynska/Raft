import {useEffect, useState} from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '@/api/notifications';
import type { Notification } from '@/types/notification';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(2);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        Promise.all([getNotifications(), getUnreadCount()])
            .then(([list, count]) => {
                if (active) { setNotifications(list); setUnreadCount(count); }
            })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const markOne = async (id: string) => {
        await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAll = async () => {
        await markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const remove = async (id: string) => {
        const wasUnread = notifications.find((n) => n.id === id)?.read === false;
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    return { notifications, unreadCount, loading, markOne, markAll, remove };
}
