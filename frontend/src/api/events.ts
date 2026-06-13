import { api } from '@/api/http';
import type { Event } from '@/types/event';

export async function getEvents(): Promise<Event[]> {
  return api.get<Event[]>('/events');
}

export async function createEvent(input: Omit<Event, 'id'>): Promise<Event> {
  return api.post<Event>('/events', {
    title: input.title,
    description: input.description,
    startTime: input.startTime,
    endTime: input.endTime,
    workspaceId: input.workspaceId ? Number(input.workspaceId) : null,
  });
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<Event> {
  return api.patch<Event>(`/events/${id}`, {
    title: patch.title,
    description: patch.description,
    startTime: patch.startTime,
    endTime: patch.endTime,
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete<void>(`/events/${id}`);
}
