import {useEffect, useState} from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '@/api/notifications';
import type { Notification } from '@/types/notification';

const now = Date.now();
const USE_MOCK = true;

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'REMINDER',
        title: 'Team meeting',
        message: 'Your meeting with the design team starts in 15 minutes.',
        sourceId: '42',
        read: false,
        createdAt: new Date(now - 10 * 60_000).toISOString(),
    },
    {
        id: '2',
        type: 'ACHIEVEMENT',
        title: 'First task completed!',
        message: 'You completed your very first task. Keep it up!',
        read: false,
        createdAt: new Date(now - 3 * 3600_000).toISOString(),
    },
    {
        id: '3',
        type: 'SYSTEM',
        title: 'Workspace invitation',
        message: 'Anna invited you to join the "Product" workspace.',
        sourceId: '7',
        read: true,
        createdAt: new Date(now - 2 * 86400_000).toISOString(),
    },
    {
        id: '4',
        type: 'SYSTEM',
        title: 'Workspace invitation',
        message: 'Anna invited you to join the "Product" workspace.',
        sourceId: '7',
        read: true,
        createdAt: new Date(now - 2 * 86400_000).toISOString(),
    },
    {
        id: '5',
        type: 'SYSTEM',
        title: 'Workspace invitation',
        message: 'Anna invited you to join the "Product" workspace.',
        sourceId: '7',
        read: true,
        createdAt: new Date(now - 2 * 86400_000).toISOString(),
    },
    {
        id: '6',
        type: 'SYSTEM',
        title: 'Workspace invitation',
        message: 'Anna invited you to join the "Product" workspace.',
        sourceId: '7',
        read: true,
        createdAt: new Date(now - 2 * 86400_000).toISOString(),
    },
];

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>(
        USE_MOCK ? MOCK_NOTIFICATIONS : []
    );
    const [unreadCount, setUnreadCount] = useState(2);
    const [loading, setLoading] = useState(!USE_MOCK);

    useEffect(() => {
        if (USE_MOCK) return;
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
        if (!USE_MOCK) await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAll = async () => {
        if (!USE_MOCK) await markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const remove = async (id: string) => {
        const wasUnread = notifications.find((n) => n.id === id)?.read === false;
        if (!USE_MOCK) await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    return { notifications, unreadCount, loading, markOne, markAll, remove };
}
