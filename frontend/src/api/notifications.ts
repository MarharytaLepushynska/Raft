import { api } from './http';
import type { Notification } from '@/types/notification';

export async function getNotifications(): Promise<Notification[]> {
    return api.get<Notification[]>('/notifications');
}

export async function getUnreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>('/notifications/unread-count');
    return res.count;
}

export async function markAsRead(id: string): Promise<Notification> {
    return api.patch<Notification>(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
    return api.patch<void>('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
    return api.delete<void>(`/notifications/${id}`);
}