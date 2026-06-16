import { useEffect, useState } from 'react';
import { createEvent, deleteEvent, getEvents, updateEvent } from '@/api/events';
import type { Event } from '@/types/event';

interface UseEventsOptions {
  workspaceId?: string;
}

/** Loads calendar events with create/update/remove. A workspaceId narrows them to one space. */
export function useEvents({ workspaceId }: UseEventsOptions = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getEvents()
      .then((all) => {
        if (!active) return;
        setEvents(workspaceId ? all.filter((event) => event.workspaceId === workspaceId) : all);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const create = async (input: Omit<Event, 'id'>): Promise<Event> => {
    const created = await createEvent(input);
    setEvents((prev) => (workspaceId && created.workspaceId !== workspaceId ? prev : [created, ...prev]));
    return created;
  };

  const update = async (id: string, patch: Partial<Event>): Promise<Event> => {
    const updated = await updateEvent(id, patch);
    setEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
    return updated;
  };

  const remove = async (id: string): Promise<void> => {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return { events, loading, create, update, remove };
}
